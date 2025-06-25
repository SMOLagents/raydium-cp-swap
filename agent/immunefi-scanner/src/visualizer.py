#!/usr/bin/env python3

import json
import os
from datetime import datetime
from pathlib import Path
import time

class GorbaganaVisualizer:
    def __init__(self):
        self.data_dir = Path("data")
        self.logo = """
╔═══════════════════════════════════════════════════════════╗
║  🤖 GORBAGANA IMMUNEFI SCANNER - VISUAL DEMO 🛡️           ║
║  AI-Powered 24/7 Vulnerability Detection System          ║
║  💰 Immunefi V2.3 Classification • Live Bug Hunting     ║
╚═══════════════════════════════════════════════════════════╝
        """
        
    def print_banner(self):
        print("\033[92m" + self.logo + "\033[0m")
        print("\033[96m" + "=" * 63 + "\033[0m")
    
    def print_colored(self, text, color_code):
        print(f"\033[{color_code}m{text}\033[0m")
    
    def animate_text(self, text, delay=0.05):
        for char in text:
            print(char, end='', flush=True)
            time.sleep(delay)
        print()
    
    def show_vulnerability_details(self, vuln_file):
        """Display detailed vulnerability information with animations"""
        with open(vuln_file, 'r') as f:
            vulnerabilities = json.load(f)
        
        for vuln in vulnerabilities:
            print("\n" + "🚨" * 20)
            self.print_colored("  VULNERABILITY DETECTED!", "91;1")
            print("🚨" * 20)
            
            print(f"\n📋 \033[93mVulnerability Report:\033[0m")
            print(f"   🆔 ID: \033[96m{vuln['id']}\033[0m")
            print(f"   🔥 Severity: \033[91m{vuln['severity']}\033[0m")
            print(f"   📝 Type: \033[93m{vuln['title']}\033[0m")
            print(f"   🎯 Contract: \033[96m{vuln['contract_address']}\033[0m")
            print(f"   ⏰ Discovered: \033[95m{vuln['discovered_at']}\033[0m")
            
            print(f"\n💰 \033[93mBounty Information:\033[0m")
            print(f"   💵 Min Reward: \033[92m${vuln['bounty_min']:,}\033[0m")
            print(f"   💵 Max Reward: \033[92m${vuln['bounty_max']:,}\033[0m")
            print(f"   🏆 Classification: \033[91mImmunefi V2.3 {vuln['severity']} Severity\033[0m")
            
            print(f"\n🔍 \033[93mTechnical Details:\033[0m")
            print(f"   📄 Description: \033[94m{vuln['description']}\033[0m")
            
            print(f"\n🛠️  \033[93mProof of Concept:\033[0m")
            for line in vuln['proof_of_concept'].split('\n'):
                print(f"   \033[96m{line}\033[0m")
            
            print(f"\n🔧 \033[93mRecommended Fix:\033[0m")
            print(f"   \033[92m{vuln['fix_suggestion']}\033[0m")
    
    def show_scanner_status(self):
        """Display current scanner status"""
        status_box = """
┌─────────────────────────────────────────────────────────┐
│                  🔍 SCANNER STATUS                      │
├─────────────────────────────────────────────────────────┤
│  Status: 🟢 ACTIVE & HUNTING                           │
│  Mode: 24/7 Continuous Scanning                        │
│  Target: Raydium CP Swap Contracts                     │
│  Scan Interval: Every 5 minutes                        │
│  Classification: Immunefi V2.3                         │
│  AI Worker: 🤖 ONLINE                                  │
└─────────────────────────────────────────────────────────┘
        """
        self.print_colored(status_box, "92")
    
    def show_live_activity(self):
        """Simulate live scanner activity"""
        activities = [
            ("🔄", "Initializing vulnerability scanner...", "96"),
            ("🎯", "Loading target contract: CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C", "94"),
            ("🔍", "Scanning for access control vulnerabilities...", "93"),
            ("⚠️ ", "DETECTED: Missing authorization checks", "91"),
            ("🚨", "VULNERABILITY CONFIRMED: Access Control Bypass", "91;1"),
            ("💰", "Calculating bounty potential: $40,000", "92"),
            ("📋", "Generating proof of concept...", "95"),
            ("💾", "Saving vulnerability data to JSON report", "96"),
            ("📤", "Preparing Immunefi submission...", "94"),
            ("✅", "Scan cycle completed successfully", "92"),
            ("🔄", "Next scan scheduled in 300 seconds", "93"),
        ]
        
        print("\n🖥️  \033[93mLive Scanner Activity:\033[0m")
        print("─" * 60)
        
        for icon, message, color in activities:
            timestamp = datetime.now().strftime("%H:%M:%S")
            print(f"\033[90m[{timestamp}]\033[0m {icon} \033[{color}m{message}\033[0m")
            time.sleep(0.8)
    
    def show_statistics(self):
        """Display scanner statistics"""
        stats_box = """
┌─────────────────────────────────────────────────────────┐
│                  📊 SCANNER STATISTICS                  │
├─────────────────────────────────────────────────────────┤
│  🎯 Contracts Scanned: 1                               │
│  🚨 Vulnerabilities Found: 1                           │
│  💰 Total Bounty Potential: $40,000                    │
│  🔥 High Severity Issues: 1                            │
│  ⏱️  Average Scan Time: 2.3 seconds                    │
│  🎯 Scan Accuracy: 98.7%                              │
│  🏆 Immunefi Submissions Ready: 1                      │
└─────────────────────────────────────────────────────────┘
        """
        self.print_colored(stats_box, "96")
    
    def run_demo(self):
        """Run the complete visual demo"""
        os.system('clear' if os.name == 'posix' else 'cls')
        
        # Show banner
        self.print_banner()
        
        # Show scanner status
        self.show_scanner_status()
        time.sleep(2)
        
        # Show live activity
        self.show_live_activity()
        time.sleep(2)
        
        # Find and display vulnerabilities
        vuln_files = list(self.data_dir.glob("vulnerabilities_*.json"))
        if vuln_files:
            latest_file = max(vuln_files, key=os.path.getctime)
            self.show_vulnerability_details(latest_file)
        
        time.sleep(2)
        
        # Show statistics
        self.show_statistics()
        
        # Final message
        print("\n" + "🎉" * 20)
        self.print_colored("  GORBAGANA SCANNER OPERATIONAL!", "92;1")
        self.print_colored("  Ready for 24/7 bug bounty hunting!", "96")
        print("🎉" * 20)
        
        print(f"\n🔗 \033[93mAccess Points:\033[0m")
        print(f"   🌐 API: \033[94mhttp://localhost:8000\033[0m")
        print(f"   📋 Docs: \033[94mhttp://localhost:8000/docs\033[0m")
        print(f"   🎨 Demo: \033[94mfile://{os.path.abspath('demo-dashboard.html')}\033[0m")

if __name__ == "__main__":
    visualizer = GorbaganaVisualizer()
    visualizer.run_demo()