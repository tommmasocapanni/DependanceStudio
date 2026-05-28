#!/usr/bin/env python3
"""Extract project content from static HTML pages into site-data.json,
   then modify each page to use project-loader.js instead."""

import re
import json
import os
import shutil

BASE = os.path.dirname(os.path.abspath(__file__))
PROJECTS_DIR = os.path.join(BASE, 'projects')
DATA_FILE = os.path.join(BASE, 'data', 'site-data.json')
LOADER_SCRIPT = '<script src="../js/project-loader.js"></script>'

# ---------------------------------------------------------------------------
# 1. Load site-data.json
# ---------------------------------------------------------------------------
with open(DATA_FILE, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Build lookup: slug -> project entry
projects_map = {p['slug']: p for p in data['projects']}

# ---------------------------------------------------------------------------
# 2. Process each HTML file
# ---------------------------------------------------------------------------
html_files = sorted(f for f in os.listdir(PROJECTS_DIR) if f.endswith('.html'))
extracted_count = 0

for filename in html_files:
    slug = filename.replace('.html', '')
    filepath = os.path.join(PROJECTS_DIR, filename)

    if slug not in projects_map:
        print(f"  ⏭  {filename}: slug '{slug}' not found in site-data.json, skipping")
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        html = f.read()

    # Find boundaries
    pc_start = html.find('<div class="page-content"')
    footer_match = re.search(r'<(section|footer)\s[^>]*class="[^"]*footer[^"]*"', html)

    if pc_start == -1:
        print(f"  ⚠  {filename}: <div class=\"page-content\"> not found, skipping")
        continue
    if not footer_match:
        print(f"  ⚠  {filename}: <section class=\"footer\"> not found, skipping")
        continue

    footer_start = footer_match.start()

    # Extract content: from <div class="page-content"> to just before <section class="footer">
    content_html = html[pc_start:footer_start].strip()

    # Save to site-data.json
    projects_map[slug]['content'] = content_html
    extracted_count += 1

    # -----------------------------------------------------------------------
    # 3. Modify the HTML file
    # -----------------------------------------------------------------------
    # Template parts:
    #   Part A: from start to just before <div class="page-content">
    #   Part B: the new #project-content div + loader
    #   Part C: from <section class="footer"> to end

    part_a = html[:pc_start]
    part_c = html[footer_start:]

    # Build new HTML
    new_html = part_a.rstrip()
    new_html += '\n\n<!-- Content loaded from site-data.json via project-loader.js -->\n'
    new_html += '<div id="project-content" class="page-content"></div>\n'
    new_html += LOADER_SCRIPT + '\n'
    new_html += part_c

    # Write modified file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_html)

    print(f"  ✅ {filename}: content extracted ({len(content_html)} chars)")

# ---------------------------------------------------------------------------
# 4. Write updated site-data.json
# ---------------------------------------------------------------------------
# Preserve the original slug pattern for chartafestival
with open(DATA_FILE, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)
    f.write('\n')

print(f"\nDone! {extracted_count}/{len(html_files)} files processed.")
print(f"site-data.json updated. Backup saved as site-data.json.bak" if os.path.exists(DATA_FILE + '.bak') else "")
