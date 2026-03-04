// 前端反下载保护脚本
(function() {
    // 禁用右键菜单
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // 禁用F12、Ctrl+Shift+I、Ctrl+Shift+J、Ctrl+U、Ctrl+S
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) ||
            (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) ||
            (e.ctrlKey && (e.key === 'U' || e.key === 'u')) ||
            (e.ctrlKey && (e.key === 'S' || e.key === 's')) ||
            (e.ctrlKey && (e.key === 'P' || e.key === 'p'))) {
            e.preventDefault();
            return false;
        }
    });
    
    // 禁用拖拽
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
    });
    
    // 禁用选择文本
    document.addEventListener('selectstart', function(e) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
            e.preventDefault();
        }
    });
    
    // 检测开发者工具
    let devtools = { open: false };
    const threshold = 160;
    
    setInterval(function() {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            if (!devtools.open) {
                devtools.open = true;
                document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg,#1a1a2e,#16213e);color:#fff;font-size:24px;text-align:center;"><div><h1>⚠️ 检测到开发者工具</h1><p style="margin-top:20px;opacity:0.7;">请关闭开发者工具后刷新页面</p></div></div>';
            }
        } else {
            devtools.open = false;
        }
    }, 500);
    
    // 禁用打印
    window.addEventListener('beforeprint', function(e) {
        e.preventDefault();
        document.body.style.display = 'none';
    });
    
    window.addEventListener('afterprint', function() {
        document.body.style.display = '';
    });
    
    // 控制台警告
    console.log('%c⚠️ 警告', 'color: red; font-size: 40px; font-weight: bold;');
    console.log('%c此浏览器功能 intended for developers. 请勿在此粘贴任何代码，否则可能导致账号被盗。', 'color: red; font-size: 16px;');
})();
