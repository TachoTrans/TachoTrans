// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
window.addEventListener('DOMContentLoaded', () => {
    const { ipcRenderer } = require('electron')
    ipcRenderer.on('asynchronous-reply', (event, arg) => {
        console.log(arg) // prints "pong"
    })
    //button and its event listener
    const b1 = document.getElementById('btn');
    b1.addEventListener('click', () => {
        ipcRenderer.send('asynchronous-message', 'btnclicked')
    })
})