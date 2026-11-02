'use strict';
/* VIMEO forms.js - client-side validation + AJAX submission */
const RULES = {
  name:    {re:/^[A-Za-z][A-Za-z '\-]{1,49}$/, msg:'Enter your name (2-50 letters; spaces, hyphens and apostrophes allowed).'},
  email:   {re:/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, msg:'Enter a valid email address, e.g. name@example.com.'},
  phone:   {re:/^\+?[0-9][0-9 \-]{8,14}$/, msg:'Enter a valid phone number, e.g. 082 123 4567 or +27 82 123 4567.'},
  message: {min:20, max:500, msg:'Your message must be between 20 and 500 characters.'}
};
function setError(field, msg){
  const wrap = field.closest('.field'); wrap.classList.toggle('invalid', !!msg);
  wrap.querySelector('.error').textContent = msg || '';
  field.setAttribute('aria-invalid', msg ? 'true' : 'false');
}
function check(f){
  const v = f.value.trim(), r = RULES[f.name];
  if(f.required && f.type==='checkbox') return f.checked ? '' : 'You must agree before sending.';
  if(f.required && !v) return 'This field is required.';
  if(!v) return '';                       // optional + empty = fine
  if(r && r.re && !r.re.test(v)) return r.msg;
  if(f.name==='message' && (v.length<r.min || v.length>r.max)) return r.msg;
  if(f.type==='date'){ const d=new Date(v), t=new Date(); t.setHours(0,0,0,0);
    if(isNaN(d) || d<t) return 'Choose today or a future date.'; }
  return '';
}
function initForm(form){
  const fields = [...form.querySelectorAll('input:not(.hp):not([type=hidden]), select, textarea')];
  const status = form.querySelector('.status'), btn = form.querySelector('button[type=submit]');
  const counter = form.querySelector('#count'), msg = form.querySelector('textarea');
  fields.forEach(f=>{ f.addEventListener('blur',()=>setError(f,check(f)));
    f.addEventListener('input',()=>{ if(f.closest('.field').classList.contains('invalid')) setError(f,check(f)); }); });
  if(msg && counter) msg.addEventListener('input',()=>counter.textContent=msg.value.length);
  form.addEventListener('submit', async e=>{
    e.preventDefault(); status.className='status';
    let first=null; fields.forEach(f=>{ const m=check(f); setError(f,m); if(m && !first) first=f; });
    if(first){ first.focus(); return; }
    if(form.querySelector('.hp').value) return;               // honeypot: bots fill this in
    btn.disabled=true; btn.textContent='Sending...';
    try{
      const res = await fetch(form.action,{method:'POST',body:new FormData(form),headers:{Accept:'application/json'}});
      if(!res.ok) throw new Error('Server responded '+res.status);
      form.reset(); if(counter) counter.textContent='0';
      status.textContent='Thank you! Your message was sent. We will reply soon.'; status.classList.add('ok');
    }catch(err){
      status.textContent='Sorry, your message could not be sent. Please try again later.'; status.classList.add('fail');
    }finally{ btn.disabled=false; btn.textContent='Send'; }
  });
}
document.addEventListener('DOMContentLoaded',()=>document.querySelectorAll('form[data-ajax]').forEach(initForm));