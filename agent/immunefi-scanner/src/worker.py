#!/usr/bin/env python3

import asyncio
import signal
import sys
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional

from scanner import VulnerabilityScanner

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/worker.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

class GorbaganaWorker:
    def __init__(self):
        self.scanner: Optional[VulnerabilityScanner] = None
        self.is_running = False
        self.shutdown_event = asyncio.Event()
        
    async def start(self):
        logger.info("🤖 Starting Gorbagana Immunefi Scanner Worker...")
        logger.info("🛡️  AI-powered 24/7 vulnerability detection activated")
        logger.info("💰 Immunefi V2.3 Classification System loaded")
        
        self.is_running = True
        
        scan_interval = int(os.getenv("SCAN_INTERVAL", "300"))
        self.scanner = VulnerabilityScanner(scan_interval=scan_interval)
        
        try:
            async with self.scanner:
                logger.info("🔍 Continuous vulnerability scanning initiated...")
                logger.info("🎯 Targeting Raydium CP Swap contracts")
                
                await self.scanner.continuous_scan()
                
        except Exception as e:
            logger.error(f"❌ Worker error: {e}")
        finally:
            self.is_running = False
            logger.info("🛑 Gorbagana Worker stopped")
    
    async def stop(self):
        logger.info("🛑 Shutdown signal received...")
        if self.scanner:
            self.scanner.stop()
        self.shutdown_event.set()
        self.is_running = False

async def signal_handler(worker: GorbaganaWorker):
    def handle_signal(signum, frame):
        logger.info(f"Received signal {signum}")
        asyncio.create_task(worker.stop())
    
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)

async def main():
    logs_dir = Path("logs")
    logs_dir.mkdir(exist_ok=True)
    
    worker = GorbaganaWorker()
    
    await signal_handler(worker)
    
    try:
        await worker.start()
    except KeyboardInterrupt:
        logger.info("🔄 Graceful shutdown initiated...")
    finally:
        await worker.stop()

if __name__ == "__main__":
    asyncio.run(main())