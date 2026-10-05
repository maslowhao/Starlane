(() => {
 const base=new URL('assets/',document.currentScript.src).href,places=StarCompanyRoutes.companies;
 const $=id=>document.getElementById(id);
 function select(id){
  const home=id==='home',place=places[id];if(!home&&!place)return;
  $('studio-scene').hidden=true;$('company-stage').hidden=!home;$('location-stage').hidden=home;
  document.querySelectorAll('[data-location]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.location===id)));
  $('location-stage').dataset.place=id;
  document.querySelectorAll('.location-owner').forEach(b=>b.hidden=b.dataset.company!==id);
  if(home)return;
  StarImages.set($('location-image'),new URL('../'+place.image,base).href,true);
  $('location-image').alt=place.name+'接待大廳';
  $('location-name').textContent=place.name;
  $('location-description').textContent='點'+place.owner+'洽談'+place.business+'。'+place.note;
  $('location-note').textContent='點負責人洽談工作，關閉列表即可回到大廳。';
 }
 document.addEventListener('click',e=>{const b=e.target.closest('[data-location]');if(b)select(b.dataset.location);if(e.target.closest('[data-home]'))select('home');});
 // Presentation routes never write or migrate a save.
 window.StarLocations={select};select('home');
})();
