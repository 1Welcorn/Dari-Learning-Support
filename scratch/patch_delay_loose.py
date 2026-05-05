
import re

def patch_file_loose(path, pattern, replacement):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace any sequence of whitespace with \s+ in the pattern
    # But first, escape regex characters
    # We want to match: <option value="#3b82f6">Azul</option>\n                           </select>
    
    match = re.search(pattern, content, re.DOTALL)
    if not match:
        print(f"Error: Could not find pattern in {path}")
        return False
    
    new_content = content[:match.start()] + replacement + content[match.end():]
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully patched {path}")
    return True

# Pattern for PlanningEditor
pattern1 = r'<option value="#3b82f6">Azul</option>\s*</select>'
replacement1 = """<option value="#3b82f6">Azul</option>
                           </select>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>DELAY DE INÍCIO: {link.delay || 0}s</span></div>
                           <input type="range" min="0" max="15" step="0.5" value={link.delay || 0} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].delay = parseFloat(e.target.value); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />"""

# Pattern for Activities
pattern2 = r'<option value="#3b82f6">Azul</option>\s*</select>\s*</div>'
replacement2 = """<option value="#3b82f6">Azul</option>
                              </select>
                           </div>
                           <div className="control-group">
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>DELAY DE INÍCIO: {link.delay || 0}s</span></div>
                              <input type="range" min="0" max="15" step="0.5" value={link.delay || 0} style={{ width: '100%', accentColor: '#10b981' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].delay = parseFloat(e.target.value); setTempLinks(nl); }} />
                           </div>"""

patch_file_loose('src/components/features/PlanningEditor.tsx', pattern1, replacement1)
patch_file_loose('src/components/features/Activities.tsx', pattern2, replacement2)
