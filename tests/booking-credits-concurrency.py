"""Authenticated integration regression: eight concurrent reservations with seven credits.
Temporary records are deleted in finally; student balance must return to its initial value.
Run with a managed administrator session already minted by lovable auth-session.
"""
import asyncio,json,os
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  context=await browser.new_context(viewport={'width':1280,'height':1800})
  page=await context.new_page()
  await page.goto('http://localhost:8080')
  with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as f: m=json.load(f)
  await page.evaluate('(m)=>{localStorage.setItem(m.storage_key,JSON.stringify(m.session));localStorage.setItem("raissa_remember","1");localStorage.setItem("raissa_login_mode","admin");}',m)
  await page.goto('http://localhost:8080/admin')
  await page.get_by_role('button',name='Cadastros',exact=True).wait_for(timeout=30000)
  result=await page.evaluate('''async()=>{
   const {base44}=await import('/src/api/base44Client.js');
   const student=await base44.entities.User.get('96ae3566-9adb-440d-94b2-ecad04cfd788');
   if(student.data.credits!==7) throw Error('Expected initial balance 7; refusing to mutate');
   const sessions=await base44.entities.ClassSession.list();
   const session=sessions.find(s=>s.is_active!==false);
   if(!session)throw Error('No session');
   const ids=[];
   try {
    const results=await Promise.allSettled(Array.from({length:8},(_,i)=>base44.entities.Booking.create({session_id:session.id,session_date:`2098-12-${String(i+1).padStart(2,'0')}`,session_time:session.time,class_type_name:session.class_type_name,student_email:student.email,student_name:student.full_name,status:'confirmada'})));
    for(const r of results)if(r.status==='fulfilled')ids.push(r.value.id);
    const after=await base44.entities.User.get(student.id);
    if(ids.length!==7 || after.data.credits!==0)throw Error(`Concurrent debit mismatch: ${ids.length} bookings, ${after.data.credits} credits`);
    const rejected=results.filter(r=>r.status==='rejected');
    if(rejected.length!==1 || !rejected[0].reason.message.includes('créditos disponíveis'))throw Error('Wrong rejection');
    return {successes:ids.length,rejected:rejected.length,remaining:after.data.credits};
   }finally{
    for(const id of ids)await base44.entities.Booking.delete(id);
    const restored=await base44.entities.User.get(student.id);
    if(restored.data.credits!==7)throw Error('Refund did not restore seven credits');
   }
  }''')
  print('Concurrency and refunds:',result)
  await page.get_by_role('button',name='Cadastros',exact=True).click()
  await page.wait_for_timeout(2000)
  text=await page.locator('body').inner_text()
  print('Student list:',text[:5500])
  os.makedirs('/tmp/browser/credits',exist_ok=True)
  await page.screenshot(path='/tmp/browser/credits/balances.png')
  await browser.close()
asyncio.run(main())
