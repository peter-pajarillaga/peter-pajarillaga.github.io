const menu=document.querySelector('.mobile-menu'),nav=document.querySelector('.shell-nav nav');
menu.addEventListener('click',()=>{const opened=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(opened))});
document.querySelectorAll('.shell-nav nav a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}));
const links=[...document.querySelectorAll('.shell-nav nav a')],sections=[...document.querySelectorAll('main section[id]')];
if('IntersectionObserver'in window){const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.toggle('current',a.hash==='#'+e.target.id))}})},{rootMargin:'-25% 0px -65% 0px'});sections.forEach(s=>obs.observe(s))}
window.addEventListener('message',e=>{const frame=document.querySelector('.hero-console iframe');if(e.source!==frame?.contentWindow)return;if(e.data?.type!=='funnelflow-crystal-select')return;const targets=['#work','#systems','#tools'];const target=document.querySelector(targets[e.data.index]);if(target)target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})});
