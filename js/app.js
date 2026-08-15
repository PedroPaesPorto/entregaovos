import { auth } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { verificarLoginEExibirTela } from './auth.js';

// Monitora se o usuário está logado
onAuthStateChanged(auth, (user) => {
    if (user) {
        verificarLoginEExibirTela(user);
    } else {
        // Redirecionar para tela de login
        console.log("Usuário não logado");
        // Aqui você chamará a função que desenha o formulário de login
    }
});
