#!/usr/bin/env python3
"""
ActiveBook Agora Lab — Local Development Server
Provides a zero-cache HTTP server for instant preview and testing.
"""

import sys
import os
import http.server
import socketserver

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent browser caching during local development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, format, *args):
        # Concise logging output
        sys.stdout.write(f"[{self.log_date_time_string()}] {format % args}\n")
        sys.stdout.flush()

def run_server(port=PORT):
    # Ensure current working directory is the script's root
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # Allow address reuse
    socketserver.TCPServer.allow_reuse_address = True
    
    with socketserver.TCPServer(("", port), NoCacheHTTPRequestHandler) as httpd:
        print(f"\n========================================================")
        print(f"  Agora Lab Development Server Running")
        print(f"  URL: http://localhost:{port}")
        print(f"  Press Ctrl+C to terminate the server.")
        print(f"========================================================\n")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer gracefully stopped.")

if __name__ == "__main__":
    run_server(PORT)
