import sys, time
sys.path.insert(0,'scripts')
import importlib.util
spec=importlib.util.spec_from_file_location('l','scripts/e2e_live.py')
m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
m.start_chrome()
p=m.new_page('https://koko673.github.io/pawsmarket/#/')
time.sleep(8)
r = p.eval("""(async function(){
  var out = [];
  for (var w of [400,500,600,700,800,900]) {
    try {
      var faces = await document.fonts.load(w + ' 16px Vazirmatn', 'تست ۱۲۳ ABC خرید');
      out.push(w + ':' + faces[0].status);
    } catch (e) { out.push(w + ':ERR'); }
  }
  return out.join('  ');
})()""")
print('font faces load:', r)
print()
loaded = p.eval("""document.fonts.forEach(function(f){
  if(f.status==='loaded') console.log(f.weight);})""")
# count woff2 transferred from our origin
tr = p.eval("""performance.getEntriesByType('resource').filter(function(e){
  return /woff2/.test(e.name);}).map(function(e){
  return {u: e.name.slice(e.name.lastIndexOf('/')-14), ok: e.transferSize>1000};});""")
ok=0; bad=0
for x in (tr or []):
    if x['ok']: ok+=1
    else: bad+=1
print(f'woff2 files >1KB (real downloads): {ok}   |   tiny/failed: {bad}')
