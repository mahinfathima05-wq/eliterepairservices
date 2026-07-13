// Settings management: localStorage + optional server sync
(function(){
  const KEY = 'adminSettings';
  const defaults = { adminName: 'Administrator', adminEmail: '', darkMode: false, emailNotifications: true, defaultView: 'dashboard' };
  function $(id){ return document.getElementById(id); }
  function loadLocal(){ try{ const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : Object.assign({}, defaults); } catch(e){ return Object.assign({}, defaults); } }
  function saveLocal(settings){ localStorage.setItem(KEY, JSON.stringify(settings)); apply(settings); }
  function apply(settings){ document.body.classList.toggle('dark', !!settings.darkMode); const emailEl = $('adminEmail'); if(emailEl) emailEl.textContent = settings.adminEmail || 'Administrator'; if(typeof showSection === 'function' && settings.defaultView){ try{ showSection(settings.defaultView + 'Section'); }catch(e){} } }
  function populate(settings){ if($('adminName')) $('adminName').value = settings.adminName || ''; if($('adminEmailInput')) $('adminEmailInput').value = settings.adminEmail || ''; if($('darkModeToggle')) $('darkModeToggle').checked = !!settings.darkMode; if($('emailNotificationsToggle')) $('emailNotificationsToggle').checked = !!settings.emailNotifications; if($('defaultViewSelect')) $('defaultViewSelect').value = settings.defaultView || 'dashboard'; }
  async function saveServer(settings){ try{ const res = await fetch('/api/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(settings) }); if(!res.ok) throw new Error('Server save failed'); return await res.json(); }catch(e){ return null; } }
  async function loadServer(){ try{ const res = await fetch('/api/settings'); if(!res.ok) return null; return await res.json(); }catch(e){ return null; } }
  document.addEventListener('DOMContentLoaded', async function(){
    // prefer server settings if available
    let settings = loadLocal();
    const serverSettings = await loadServer();
    if(serverSettings && typeof serverSettings === 'object'){
      settings = Object.assign({}, defaults, serverSettings);
      saveLocal(settings);
    }
    populate(settings); apply(settings);

    const saveBtn = $('saveSettingsBtn'); if(saveBtn) saveBtn.addEventListener('click', async function(){ const s = { adminName: $('adminName').value.trim() || defaults.adminName, adminEmail: $('adminEmailInput').value.trim(), darkMode: !!$('darkModeToggle').checked, emailNotifications: !!$('emailNotificationsToggle').checked, defaultView: $('defaultViewSelect').value || 'dashboard' };
        saveLocal(s);
        await saveServer(s);
        alert('Settings saved.');
    });

    const restoreBtn = $('restoreDefaultsBtn'); if(restoreBtn) restoreBtn.addEventListener('click', async function(){ if(confirm('Restore default settings?')){ localStorage.removeItem(KEY); populate(defaults); apply(defaults); await saveServer(defaults); alert('Defaults restored.'); } });
  });
})();
