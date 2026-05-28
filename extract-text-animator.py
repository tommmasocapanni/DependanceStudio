"""
Replace inline TextAnimator definitions across all HTML files with a shared script include.
"""
import re
import os

REPO = '/Users/tommasocapanni/Desktop/worky/DependanceStudio_Website_Backup'
SHARED = '<script src="/DependanceStudio/js/text-animator.js"></script>'

def read(path):
    with open(path, 'r') as f:
        return f.read()

def write(path, content):
    with open(path, 'w') as f:
        f.write(content)

def replace_simple_script(filepath, start_marker, end_marker, replacement_insert):
    """Replace a script block that is entirely self-contained."""
    content = read(filepath)
    if start_marker not in content:
        print(f"  WARN: start_marker not found in {filepath}")
        return False
    if end_marker not in content:
        # end_marker might be part of the same block
        pass
    
    # Find the script block boundaries
    idx_start = content.index(start_marker)
    # Find the matching </script> after start_marker
    idx_end = content.index('</script>', idx_start) + len('</script>')
    
    new_content = content[:idx_start] + replacement_insert + content[idx_end:]
    write(filepath, new_content)
    print(f"  Updated {filepath}")
    return True

def remove_initTextAnimations(content, add_include=True):
    """Remove function initTextAnimations() { ... } from content.
    Instead of trying to match braces (unreliable), we remove line-by-line
    from 'function initTextAnimations()' to the matching top-level closing brace.
    """
    lines = content.split('\n')
    result = []
    in_func = False
    brace_depth = 0
    func_started = False
    
    for line in lines:
        stripped = line.strip()
        if not func_started and 'function initTextAnimations()' in stripped:
            func_started = True
            in_func = True
            brace_depth = 0
            # Count braces on this line
            for ch in line:
                if ch == '{': brace_depth += 1
                if ch == '}': brace_depth -= 1
            if brace_depth <= 0:
                in_func = False
            continue
        
        if in_func:
            for ch in line:
                if ch == '{': brace_depth += 1
                if ch == '}': brace_depth -= 1
            if brace_depth <= 0:
                in_func = False
            continue
        
        result.append(line)
    
    return '\n'.join(result)

def handle_simple(filepath):
    """Files where the entire script block is just TextAnimator + load listener."""
    content = read(filepath)
    
    # Find the pattern: <script> ... function initTextAnimations() ... </script>
    # Replace with shared include + minimal load listener
    pattern_script = re.compile(
        r'<script>\s*\n\s*function initTextAnimations\(\)\s*\{.*?window\.addEventListener\(\'load\'.*?</script>',
        re.DOTALL
    )
    match = pattern_script.search(content)
    if not match:
        # Try other patterns
        pattern_script2 = re.compile(
            r'<script>\s*\n\s*function initTextAnimations\(\)\s*\{.*?</script>',
            re.DOTALL
        )
        match = pattern_script2.search(content)
    
    if not match:
        print(f"  WARN: Could not find pattern in {filepath}")
        return False
    
    replacement = f'{SHARED}\n<script>window.addEventListener(\'load\', initTextAnimations);</script>'
    new_content = content[:match.start()] + replacement + content[match.end():]
    write(filepath, new_content)
    print(f"  Updated {filepath}")
    return True

def handle_complex(filepath):
    """Files where the script block contains TextAnimator + other code."""
    content = read(filepath)
    
    # Find the pattern <script> ... function initTextAnimations() { ... }
    # But keep everything else in the file
    new_content = remove_initTextAnimations(content)
    
    # Add shared include before the first <script> that had initTextAnimations
    # Find where we removed it and put the include there
    if SHARED not in new_content:
        # Find a good spot: right before any <script> tag
        # Actually, just put it before the first remaining <script> that has gsap.registerPlugin or similar
        idx = -1
        for pattern in ['gsap.registerPlugin', 'document.querySelectorAll', 'window.addEventListener']:
            pos = new_content.find(pattern)
            if pos > 0:
                idx = pos
                # Walk back to the start of the line or script tag
                while idx > 0 and new_content[idx] != '<':
                    idx -= 1
                if new_content[idx:idx+8] == '<script>' or new_content[idx:idx+8] == '<script ':
                    break
                idx = -1
        
        if idx > 0:
            new_content = new_content[:idx] + SHARED + '\n' + new_content[idx:]
        else:
            # Fallback: put after <body> or at end of head
            body_idx = new_content.find('<body')
            if body_idx > 0:
                # Find closing > of body tag
                close_idx = new_content.index('>', body_idx) + 1
                new_content = new_content[:close_idx] + '\n' + SHARED + new_content[close_idx:]
            else:
                new_content = new_content + '\n' + SHARED
    
    write(filepath, new_content)
    print(f"  Updated {filepath}")
    return True

# ---- Process each file ----

# Group 1: Simple files - entire script block is just TextAnimator
simple_files = [
    'projects/videocitta-x-ied.html',
    'projects/reveries.html',
    'projects/regal-involve-records.html',
    'projects/omis-elegia.html',
    'projects/hyperacustica-x-muretto.html',
    'projects/formazione-organica.html',
    'projects/computer-generated-memories.html',
    'projects/chartafestival-x-dependance.html',
    'projects/spooky-factory-inc.html',
]

# Group 2: Complex files - has other code in same script block
complex_files = [
    'projects/umbria-resort-spa.html',
    'projects/immobiliarebagnacavallo.html',
    'about-us.html',
]

# Group 3: index.html - TextAnimator is in its own block (first script), but has custom load listener
# We handle it separately

print("=== Simple project files ===")
for f in simple_files:
    handle_simple(os.path.join(REPO, f))

print("\n=== Complex files ===")
for f in complex_files:
    handle_complex(os.path.join(REPO, f))

print("\n=== index.html ===")
handle_simple(os.path.join(REPO, 'index.html'))

print("\nDone!")
