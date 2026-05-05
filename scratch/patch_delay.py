
import sys

def patch_file(path, search_str, replace_str):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    if search_str not in content:
        print(f"Error: Could not find search string in {path}")
        return False
    new_content = content.replace(search_str, replace_str)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully patched {path}")
    return True

# PlanningEditor.tsx
search1 = """<option value="#3b82f6">Azul</option>
                           </select>"""
replace1 = """<option value="#3b82f6">Azul</option>
                           </select>
                           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 900 }}><span>DELAY DE INÍCIO: {link.delay || 0}s</span></div>
                           <input type="range" min="0" max="15" step="0.5" value={link.delay || 0} style={{ width: '100%' }} onChange={(e) => { const nl = [...unitData.external_links]; nl[i].delay = parseFloat(e.target.value); setUnitData({...unitData, external_links: nl}); setIsDirty(true); }} />"""

# Activities.tsx
search2 = """<option value="#3b82f6">Azul</option>
                              </select>
                           </div>"""
replace2 = """<option value="#3b82f6">Azul</option>
                              </select>
                           </div>
                           <div className="control-group">
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 900, color: '#64748b', marginBottom: '4px' }}><span>DELAY DE INÍCIO: {link.delay || 0}s</span></div>
                              <input type="range" min="0" max="15" step="0.5" value={link.delay || 0} style={{ width: '100%', accentColor: '#10b981' }} onChange={(e) => { const nl = [...tempLinks]; nl[lIdx].delay = parseFloat(e.target.value); setTempLinks(nl); }} />
                           </div>"""

patch_file('src/components/features/PlanningEditor.tsx', search1, replace1)
patch_file('src/components/features/Activities.tsx', search2, replace2)
