#!/usr/bin/env python3

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
import asyncio
import json
import logging
from pathlib import Path
from datetime import datetime
import uvicorn

from scanner import VulnerabilityScanner, SeverityLevel, Vulnerability

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Gorbagana Immunefi Vulnerability Scanner",
    description="24/7 AI-powered vulnerability scanner with Immunefi V2.3 classification",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

scanner_instance: Optional[VulnerabilityScanner] = None
scanner_task: Optional[asyncio.Task] = None

@app.on_event("startup")
async def startup_event():
    global scanner_instance, scanner_task
    logger.info("Starting Gorbagana Immunefi Scanner API...")
    
    scanner_instance = VulnerabilityScanner(scan_interval=300)
    await scanner_instance.__aenter__()
    
    scanner_task = asyncio.create_task(scanner_instance.continuous_scan())
    logger.info("Background vulnerability scanning started")

@app.on_event("shutdown")
async def shutdown_event():
    global scanner_instance, scanner_task
    logger.info("Shutting down Gorbagana Immunefi Scanner...")
    
    if scanner_instance:
        scanner_instance.stop()
        await scanner_instance.__aexit__(None, None, None)
    
    if scanner_task:
        scanner_task.cancel()
        try:
            await scanner_task
        except asyncio.CancelledError:
            pass

@app.get("/")
async def root():
    return {
        "service": "Gorbagana Immunefi Vulnerability Scanner",
        "version": "1.0.0",
        "status": "active",
        "immunefi_version": "V2.3"
    }

@app.get("/health")
async def health_check():
    global scanner_instance
    
    if not scanner_instance:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    return {
        "status": "healthy",
        "scanner_running": scanner_instance.is_running,
        "last_scan": scanner_instance.last_scan,
        "uptime": datetime.now().isoformat()
    }

@app.get("/status")
async def get_scanner_status():
    global scanner_instance
    
    if not scanner_instance:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    return {
        "is_running": scanner_instance.is_running,
        "last_scan": scanner_instance.last_scan,
        "total_vulnerabilities": len(scanner_instance.vulnerabilities),
        "scan_interval": scanner_instance.scan_interval
    }

@app.get("/vulnerabilities")
async def get_vulnerabilities(
    severity: Optional[str] = None,
    limit: Optional[int] = 100,
    offset: Optional[int] = 0
):
    global scanner_instance
    
    if not scanner_instance:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    vulnerabilities = scanner_instance.vulnerabilities
    
    if severity:
        try:
            severity_filter = SeverityLevel(severity.title())
            vulnerabilities = [v for v in vulnerabilities if v.severity == severity_filter]
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid severity level: {severity}")
    
    vulnerabilities = vulnerabilities[offset:offset + limit]
    
    return [v.to_dict() for v in vulnerabilities]

@app.get("/vulnerabilities/critical")
async def get_critical_vulnerabilities():
    global scanner_instance
    
    if not scanner_instance:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    critical_vulns = [
        v for v in scanner_instance.vulnerabilities 
        if v.severity == SeverityLevel.CRITICAL
    ]
    
    return {
        "count": len(critical_vulns),
        "total_bounty_potential": sum(v.bounty_max for v in critical_vulns),
        "vulnerabilities": [v.to_dict() for v in critical_vulns]
    }

@app.post("/scan/manual")
async def trigger_manual_scan(contract_address: str, background_tasks: BackgroundTasks):
    global scanner_instance
    
    if not scanner_instance:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    background_tasks.add_task(perform_manual_scan, contract_address)
    
    return {
        "message": f"Manual scan initiated for contract {contract_address}",
        "status": "started"
    }

async def perform_manual_scan(contract_address: str):
    global scanner_instance
    
    try:
        logger.info(f"Starting manual scan for contract: {contract_address}")
        vulnerabilities = await scanner_instance.scan_smart_contract(contract_address)
        
        if vulnerabilities:
            scanner_instance.vulnerabilities.extend(vulnerabilities)
            await scanner_instance._save_vulnerabilities(vulnerabilities)
            await scanner_instance._alert_critical_vulnerabilities(vulnerabilities)
            logger.info(f"Manual scan completed: {len(vulnerabilities)} vulnerabilities found")
        else:
            logger.info("Manual scan completed: No vulnerabilities found")
            
    except Exception as e:
        logger.error(f"Error during manual scan: {e}")

@app.get("/bounty-calculator")
async def calculate_bounty(severity: str, funds_at_risk: Optional[int] = None):
    try:
        severity_level = SeverityLevel(severity.title())
        from scanner import ImmunefiBountyCalculator
        
        bounty_info = ImmunefiBountyCalculator.calculate_bounty(severity_level, funds_at_risk)
        
        return {
            "severity": severity_level.value,
            "bounty_range": bounty_info,
            "funds_at_risk": funds_at_risk,
            "calculation_note": "Critical vulnerabilities capped at 10% of funds at risk (minimum $50,000)"
        }
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid severity level: {severity}")

@app.get("/statistics")
async def get_statistics():
    global scanner_instance
    
    if not scanner_instance:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    vulnerabilities = scanner_instance.vulnerabilities
    
    severity_counts = {}
    total_bounty_potential = 0
    
    for severity in SeverityLevel:
        count = len([v for v in vulnerabilities if v.severity == severity])
        severity_counts[severity.value] = count
        
        if count > 0:
            bounty_sum = sum(v.bounty_max for v in vulnerabilities if v.severity == severity)
            total_bounty_potential += bounty_sum
    
    return {
        "total_vulnerabilities": len(vulnerabilities),
        "severity_breakdown": severity_counts,
        "total_bounty_potential": total_bounty_potential,
        "last_scan": scanner_instance.last_scan,
        "scanner_uptime": scanner_instance.is_running
    }

@app.get("/export")
async def export_vulnerabilities(format: str = "json"):
    global scanner_instance
    
    if not scanner_instance:
        raise HTTPException(status_code=503, detail="Scanner not initialized")
    
    if format.lower() not in ["json", "csv"]:
        raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")
    
    vulnerabilities = scanner_instance.vulnerabilities
    
    if format.lower() == "json":
        return {
            "export_timestamp": datetime.now().isoformat(),
            "total_count": len(vulnerabilities),
            "vulnerabilities": [v.to_dict() for v in vulnerabilities]
        }
    
    return {"message": "CSV export functionality coming soon"}

if __name__ == "__main__":
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )