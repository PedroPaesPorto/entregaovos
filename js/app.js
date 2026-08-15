import { auth } from './firebase-init.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { verificarLoginEExibirTela, exibirTelaLogin } from './auth.js';

onAuthStateChanged(auth, (user) => {
    if (user) {
        verificarLoginEExibirTela(user);
    } else {
        exibirTelaLogin();
    }
});
