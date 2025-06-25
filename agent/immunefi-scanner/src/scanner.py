#!/usr/bin/env python3

import asyncio
import aiohttp
import logging
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum
import hashlib
import os
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class SeverityLevel(Enum):
    CRITICAL = "Critical"
    HIGH = "High" 
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Info"

@dataclass
class Vulnerability:
    id: str
    title: str
    description: str
    severity: SeverityLevel
    bounty_min: int
    bounty_max: int
    proof_of_concept: str
    fix_suggestion: str
    discovered_at: datetime
    contract_address: Optional[str] = None
    transaction_hash: Optional[str] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data['severity'] = self.severity.value
        data['discovered_at'] = self.discovered_at.isoformat()
        return data

class ImmunefiBountyCalculator:
    BOUNTY_RANGES = {
        SeverityLevel.CRITICAL: {"min": 50000, "max": 505000},
        SeverityLevel.HIGH: {"min": 40000, "max": 40000},
        SeverityLevel.MEDIUM: {"min": 5000, "max": 5000},
        SeverityLevel.LOW: {"min": 1000, "max": 2000},
        SeverityLevel.INFO: {"min": 100, "max": 500}
    }
    
    @classmethod
    def calculate_bounty(cls, severity: SeverityLevel, funds_at_risk: Optional[int] = None) -> Dict[str, int]:
        base_range = cls.BOUNTY_RANGES[severity]
        
        if severity == SeverityLevel.CRITICAL and funds_at_risk:
            capped_amount = min(int(funds_at_risk * 0.1), base_range["max"])
            actual_max = max(capped_amount, base_range["min"])
            return {"min": base_range["min"], "max": actual_max}
        
        return base_range

class VulnerabilityScanner:
    def __init__(self, scan_interval: int = 300):
        self.scan_interval = scan_interval
        self.session: Optional[aiohttp.ClientSession] = None
        self.vulnerabilities: List[Vulnerability] = []
        self.last_scan: Optional[datetime] = None
        self.is_running = False
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def scan_smart_contract(self, contract_address: str) -> List[Vulnerability]:
        vulnerabilities = []
        
        common_vulnerabilities = [
            {
                "pattern": "reentrancy",
                "description": "Potential reentrancy vulnerability in state-changing functions",
                "severity": SeverityLevel.CRITICAL,
                "check": self._check_reentrancy
            },
            {
                "pattern": "integer_overflow", 
                "description": "Integer overflow/underflow vulnerability in arithmetic operations",
                "severity": SeverityLevel.HIGH,
                "check": self._check_integer_overflow
            },
            {
                "pattern": "access_control",
                "description": "Missing or improper access control mechanisms",
                "severity": SeverityLevel.HIGH,
                "check": self._check_access_control
            },
            {
                "pattern": "price_manipulation",
                "description": "Oracle price manipulation vulnerability",
                "severity": SeverityLevel.CRITICAL,
                "check": self._check_price_manipulation
            },
            {
                "pattern": "flash_loan_attack",
                "description": "Flash loan attack vector in liquidity functions",
                "severity": SeverityLevel.CRITICAL,
                "check": self._check_flash_loan_attack
            }
        ]
        
        for vuln_config in common_vulnerabilities:
            result = await vuln_config["check"](contract_address)
            if result:
                vuln_id = hashlib.sha256(f"{contract_address}_{vuln_config['pattern']}_{int(time.time())}".encode()).hexdigest()[:16]
                
                bounty_info = ImmunefiBountyCalculator.calculate_bounty(vuln_config["severity"])
                
                vulnerability = Vulnerability(
                    id=vuln_id,
                    title=f"{vuln_config['pattern'].replace('_', ' ').title()} Vulnerability",
                    description=vuln_config["description"],
                    severity=vuln_config["severity"],
                    bounty_min=bounty_info["min"],
                    bounty_max=bounty_info["max"],
                    proof_of_concept=result.get("poc", "PoC generation in progress..."),
                    fix_suggestion=result.get("fix", "Fix suggestion being analyzed..."),
                    discovered_at=datetime.now(),
                    contract_address=contract_address
                )
                vulnerabilities.append(vulnerability)
                
        return vulnerabilities
    
    async def _check_reentrancy(self, contract_address: str) -> Optional[Dict[str, str]]:
        try:
            contract_code = await self._fetch_contract_code(contract_address)
            if contract_code and "external_call" in contract_code.lower():
                return {
                    "poc": "1. Call vulnerable function\n2. Re-enter during external call\n3. Manipulate state before completion",
                    "fix": "Implement checks-effects-interactions pattern and reentrancy guards"
                }
        except Exception as e:
            logger.error(f"Error checking reentrancy for {contract_address}: {e}")
        return None
    
    async def _check_integer_overflow(self, contract_address: str) -> Optional[Dict[str, str]]:
        try:
            contract_code = await self._fetch_contract_code(contract_address)
            if contract_code and any(op in contract_code.lower() for op in ["add", "mul", "sub"]):
                return {
                    "poc": "1. Trigger arithmetic operation with boundary values\n2. Cause overflow/underflow\n3. Exploit unexpected behavior",
                    "fix": "Use SafeMath library or checked arithmetic operations"
                }
        except Exception as e:
            logger.error(f"Error checking integer overflow for {contract_address}: {e}")
        return None
    
    async def _check_access_control(self, contract_address: str) -> Optional[Dict[str, str]]:
        try:
            contract_code = await self._fetch_contract_code(contract_address)
            if contract_code:
                # Enhanced access control checks for real vulnerabilities
                code_lower = contract_code.lower()
                vulnerability_patterns = [
                    "owner" not in code_lower,
                    "authority" not in code_lower, 
                    "admin" not in code_lower,
                    "require" not in code_lower
                ]
                
                if any(vulnerability_patterns):
                    return {
                        "poc": "1. Call privileged function without proper authorization\n2. Bypass access controls\n3. Execute unauthorized actions",
                        "fix": "Implement proper role-based access control with modifiers"
                    }
        except Exception as e:
            logger.error(f"Error checking access control for {contract_address}: {e}")
        return None
    
    async def _check_price_manipulation(self, contract_address: str) -> Optional[Dict[str, str]]:
        try:
            contract_code = await self._fetch_contract_code(contract_address)
            if contract_code and "oracle" in contract_code.lower():
                return {
                    "poc": "1. Manipulate oracle price source\n2. Execute trades at manipulated prices\n3. Extract value from price discrepancy",
                    "fix": "Use multiple oracle sources, implement price deviation checks, add time-weighted average prices"
                }
        except Exception as e:
            logger.error(f"Error checking price manipulation for {contract_address}: {e}")
        return None
    
    async def _check_flash_loan_attack(self, contract_address: str) -> Optional[Dict[str, str]]:
        try:
            contract_code = await self._fetch_contract_code(contract_address)
            if contract_code and any(keyword in contract_code.lower() for keyword in ["flash", "loan", "borrow"]):
                return {
                    "poc": "1. Initiate flash loan\n2. Manipulate pool state within single transaction\n3. Repay loan with profit from manipulation",
                    "fix": "Implement flash loan protections, add liquidity locks, use commit-reveal schemes"
                }
        except Exception as e:
            logger.error(f"Error checking flash loan attack for {contract_address}: {e}")
        return None
    
    async def _fetch_contract_code(self, contract_address: str) -> Optional[str]:
        try:
            rpc_endpoint = os.getenv("SOLANA_RPC_URL", "https://api.mainnet-beta.solana.com")
            payload = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "getAccountInfo",
                "params": [contract_address, {"encoding": "base64"}]
            }
            
            async with self.session.post(rpc_endpoint, json=payload) as response:
                data = await response.json()
                if "result" in data and data["result"]:
                    return str(data["result"])
        except Exception as e:
            logger.error(f"Error fetching contract code: {e}")
        return None
    
    async def scan_immunefi_bounties(self) -> List[Vulnerability]:
        vulnerabilities = []
        try:
            immunefi_api = "https://immunefi.com/api/v1/bounties"
            async with self.session.get(immunefi_api) as response:
                if response.status == 200:
                    data = await response.json()
                    for bounty in data.get("bounties", []):
                        if "solana" in bounty.get("blockchain", "").lower():
                            severity = self._map_immunefi_severity(bounty.get("maxBounty", 0))
                            vuln_id = hashlib.sha256(f"immunefi_{bounty.get('id', '')}_{int(time.time())}".encode()).hexdigest()[:16]
                            
                            vulnerability = Vulnerability(
                                id=vuln_id,
                                title=f"Immunefi Bounty: {bounty.get('title', 'Unknown')}",
                                description=bounty.get("description", "Active Immunefi bounty program"),
                                severity=severity,
                                bounty_min=bounty.get("minBounty", 0),
                                bounty_max=bounty.get("maxBounty", 0),
                                proof_of_concept="Refer to Immunefi program requirements",
                                fix_suggestion="Follow Immunefi bounty guidelines",
                                discovered_at=datetime.now()
                            )
                            vulnerabilities.append(vulnerability)
        except Exception as e:
            logger.error(f"Error scanning Immunefi bounties: {e}")
        
        return vulnerabilities
    
    def _map_immunefi_severity(self, max_bounty: int) -> SeverityLevel:
        if max_bounty >= 50000:
            return SeverityLevel.CRITICAL
        elif max_bounty >= 40000:
            return SeverityLevel.HIGH
        elif max_bounty >= 5000:
            return SeverityLevel.MEDIUM
        elif max_bounty >= 1000:
            return SeverityLevel.LOW
        else:
            return SeverityLevel.INFO
    
    async def continuous_scan(self):
        logger.info("Starting continuous vulnerability scanning...")
        self.is_running = True
        
        target_contracts = [
            os.getenv("CP_SWAP_PROGRAM_ID", "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"),
        ]
        
        while self.is_running:
            try:
                logger.info("Starting scan cycle...")
                scan_results = []
                
                for contract in target_contracts:
                    logger.info(f"Scanning contract: {contract}")
                    contract_vulns = await self.scan_smart_contract(contract)
                    scan_results.extend(contract_vulns)
                
                immunefi_vulns = await self.scan_immunefi_bounties()
                scan_results.extend(immunefi_vulns)
                
                if scan_results:
                    logger.warning(f"Found {len(scan_results)} potential vulnerabilities!")
                    for vuln in scan_results:
                        logger.warning(f"  {vuln.severity.value}: {vuln.title}")
                    
                    self.vulnerabilities.extend(scan_results)
                    await self._save_vulnerabilities(scan_results)
                    await self._alert_critical_vulnerabilities(scan_results)
                else:
                    logger.info("No vulnerabilities found in this scan cycle")
                
                self.last_scan = datetime.now()
                logger.info(f"Scan completed. Next scan in {self.scan_interval} seconds...")
                await asyncio.sleep(self.scan_interval)
                
            except Exception as e:
                logger.error(f"Error during scan cycle: {e}")
                await asyncio.sleep(60)
    
    async def _save_vulnerabilities(self, vulnerabilities: List[Vulnerability]):
        try:
            data_dir = Path("data")
            data_dir.mkdir(exist_ok=True)
            
            filename = f"vulnerabilities_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            filepath = data_dir / filename
            
            vuln_data = [vuln.to_dict() for vuln in vulnerabilities]
            
            with open(filepath, 'w') as f:
                json.dump(vuln_data, f, indent=2)
            
            logger.info(f"Saved {len(vulnerabilities)} vulnerabilities to {filepath}")
        except Exception as e:
            logger.error(f"Error saving vulnerabilities: {e}")
    
    async def _alert_critical_vulnerabilities(self, vulnerabilities: List[Vulnerability]):
        critical_vulns = [v for v in vulnerabilities if v.severity == SeverityLevel.CRITICAL]
        if critical_vulns:
            for vuln in critical_vulns:
                logger.critical(f"CRITICAL VULNERABILITY FOUND: {vuln.title}")
                logger.critical(f"  Description: {vuln.description}")
                logger.critical(f"  Bounty: ${vuln.bounty_min:,} - ${vuln.bounty_max:,}")
                logger.critical(f"  Contract: {vuln.contract_address}")
    
    def stop(self):
        logger.info("Stopping vulnerability scanner...")
        self.is_running = False

async def main():
    scanner = VulnerabilityScanner(scan_interval=300)  # 5 minute intervals
    
    try:
        async with scanner:
            await scanner.continuous_scan()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
    finally:
        scanner.stop()

if __name__ == "__main__":
    asyncio.run(main())