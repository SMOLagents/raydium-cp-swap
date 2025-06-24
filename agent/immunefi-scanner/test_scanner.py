#!/usr/bin/env python3

import asyncio
import sys
import os
sys.path.append('src')

from scanner import VulnerabilityScanner, SeverityLevel

async def test_scanner():
    print("🤖 Testing Gorbagana Immunefi Scanner...")
    print("🛡️  AI-powered vulnerability detection")
    print("💰 Immunefi V2.3 Classification System")
    print()
    
    scanner = VulnerabilityScanner(scan_interval=10)
    
    try:
        async with scanner:
            print("🔍 Testing contract scan...")
            contract_address = "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C"
            
            vulnerabilities = await scanner.scan_smart_contract(contract_address)
            
            print(f"✅ Scan completed! Found {len(vulnerabilities)} vulnerabilities:")
            print()
            
            for vuln in vulnerabilities:
                print(f"🚨 {vuln.severity.value}: {vuln.title}")
                print(f"   💰 Bounty: ${vuln.bounty_min:,} - ${vuln.bounty_max:,}")
                print(f"   📝 {vuln.description}")
                print(f"   🔧 Fix: {vuln.fix_suggestion}")
                print()
            
            if vulnerabilities:
                critical_count = len([v for v in vulnerabilities if v.severity == SeverityLevel.CRITICAL])
                high_count = len([v for v in vulnerabilities if v.severity == SeverityLevel.HIGH])
                
                total_bounty = sum(v.bounty_max for v in vulnerabilities)
                
                print(f"📊 Summary:")
                print(f"   🔴 Critical: {critical_count}")
                print(f"   🟠 High: {high_count}")
                print(f"   💰 Total Bounty Potential: ${total_bounty:,}")
                
                if critical_count > 0:
                    print("⚠️  CRITICAL VULNERABILITIES DETECTED!")
                    print("💸 Immediate action required - significant bounty potential!")
            else:
                print("✅ No vulnerabilities detected in this scan")
            
            print()
            print("🔄 Scanner is now ready for 24/7 operation")
            print("🌐 Run 'python src/api.py' to start the web API")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_scanner())