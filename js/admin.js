import { db, auth } from './firebase-init.js';
import { collection, addDoc, onSnapshot, query, orderBy, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

export function renderizarPainelAdmin(conteudoDiv, emailUsuario) {
    conteudoDiv.innerHTML = `
        <div class="mb-6 flex justify-between items-center border-b pb-4">
            <div>
                <h3 class="font-semibold text-lg text-amber-600">Painel Administrativo</h3>
                <p class="text-sm text-slate-500">Gerencie cadastros, entregas e acessos do sistema.</p>
            </div>
            <span class="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-semibold">Admin</span>
        </div>

        <!-- Abas Internas do Admin -->
        <div class="flex gap-4 border-b mb-6 text-sm overflow-x-auto">
            <button onclick="mudarAbaAdmin('clientes')" id="btn-aba-clientes" class="pb-2 font-medium text-amber-600 border-b-2 border-amber-600 transition-all">Clientes</button>
            <button onclick="mudarAbaAdmin('entregadores')" id="btn-aba-entregadores" class="pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all">Entregadores</button>
            <button onclick="mudarAbaAdmin('veiculos')" id="btn-aba-veiculos" class="pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all">Veículos</button>
            <button onclick="mudarAbaAdmin('usuarios')" id="btn-aba-usuarios" class="pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all">Controle de Usuários</button>
        </div>

        <!-- SEÇÃO CLIENTES -->
        <div id="secao-clientes" class="space-y-6">
            <div class="bg-slate-50 p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Novo Cliente</h4>
                <form id="form-cliente" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" id="c-nome" placeholder="Nome" required class="px-3 py-2 border rounded-lg bg-white">
                    <input type="text" id="c-tel" placeholder="Telefone" required class="px-3 py-2 border rounded-lg bg-white">
                    <input type="text" id="c-end" placeholder="Endereço" required class="md:col-span-2 px-3 py-2 border rounded-lg bg-white">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-all">Salvar Cliente</button>
                </form>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left border-collapse">
                    <thead><tr class="border-b text-slate-400"><th class="p-2">Nome</th><th class="p-2">Telefone</th><th class="p-2">Endereço</th></tr></thead>
                    <tbody id="tabela-clientes"></tbody>
                </table>
            </div>
        </div>

        <!-- SEÇÃO ENTREGADORES -->
        <div id="secao-entregadores" class="space-y-6 hidden">
            <div class="bg-slate-50 p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Novo Entregador</h4>
                <form id="form-entregador" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" id="e-nome" placeholder="Nome" required class="px-3 py-2 border rounded-lg bg-white">
                    <input type="text" id="e-tel" placeholder="Telefone" required class="px-3 py-2 border rounded-lg bg-white">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-all">Salvar Entregador</button>
                </form>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left border-collapse">
                    <thead><tr class="border-b text-slate-400"><th class="p-2">Nome</th><th class="p-2">Telefone</th></tr></thead>
                    <tbody id="tabela-entregadores"></tbody>
                </table>
            </div>
        </div>

        <!-- SEÇÃO VEÍCULOS -->
        <div id="secao-veiculos" class="space-y-6 hidden">
            <div class="bg-slate-50 p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Novo Veículo</h4>
                <form id="form-veiculo" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" id="v-modelo" placeholder="Modelo" required class="px-3 py-2 border rounded-lg bg-white">
                    <input type="text" id="v-placa" placeholder="Placa" required class="px-3 py-2 border rounded-lg bg-white">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-all">Salvar Veículo</button>
                </form>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left border-collapse">
                    <thead><tr class="border-b text-slate-400"><th class="p-2">Modelo</th><th class="p-2">Placa</th></tr></thead>
                    <tbody id="tabela-veiculos"></tbody>
                </table>
            </div>
        </div>

        <!-- SEÇÃO USUÁRIOS (NOVO) -->
        <div id="secao-usuarios" class="space-y-6 hidden">
            <div class="bg-slate-50 p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Cadastrar Novo Usuário do Sistema</h4>
                <form id="form-usuario" class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="email" id="u-email" placeholder="E-mail de acesso" required class="px-3 py-2 border rounded-lg bg-white">
                    <input type="password" id="u-senha" placeholder="Senha temporária (mín. 6 caracteres)" required class="px-3 py-2 border rounded-lg bg-white">
                    <select id="u-perfil" class="px-3 py-2 border rounded-lg bg-white text-slate-700">
                        <option value="entregador">Entregador</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="admin">Administrador</option>
                    </select>
                    <button type="submit" class="md:col-span-3 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-all">Criar Acesso</button>
                </form>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-sm text-left border-collapse">
                    <thead><tr class="border-b text-slate-400"><th class="p-2">E-mail</th><th class="p-2">Perfil</th></tr></thead>
                    <tbody id="tabela-usuarios"></tbody>
                </table>
            </div>
        </div>
    `;

    // Função global para alternar as sub-abas do admin
    window.mudarAbaAdmin = (aba) => {
        ['clientes', 'entregadores', 'veiculos', 'usuarios'].forEach(a => {
            document.getElementById(`secao-${a}`).classList.toggle('hidden', a !== aba);
            document.getElementById(`btn-aba-${a}`).className = (a === aba) 
                ? "pb-2 font-medium text-amber-600 border-b-2 border-amber-600 transition-all" 
                : "pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all";
        });
    };

    // Lógica de Salvar genérica para cadastros comuns
    const salvar = async (colecao, campos, formId) => {
        try {
            await addDoc(collection(db, colecao), { ...campos, criadoEm: new Date() });
            document.getElementById(formId).reset();
        } catch (e) {
            alert("Erro ao salvar: " + e.message);
        }
    };

    document.getElementById('form-cliente').onsubmit = (e) => { 
        e.preventDefault(); 
        salvar('clientes', { nome: document.getElementById('c-nome').value, telefone: document.getElementById('c-tel').value, endereco: document.getElementById('c-end').value }, 'form-cliente'); 
    };
    
    document.getElementById('form-entregador').onsubmit = (e) => { 
        e.preventDefault(); 
        salvar('entregadores', { nome: document.getElementById('e-nome').value, telefone: document.getElementById('e-tel').value }, 'form-entregador'); 
    };
    
    document.getElementById('form-veiculo').onsubmit = (e) => { 
        e.preventDefault(); 
        salvar('veiculos', { modelo: document.getElementById('v-modelo').value, placa: document.getElementById('v-placa').value }, 'form-veiculo'); 
    };

    // Lógica para cadastrar novo Usuário do Sistema sem deslogar o Admin
    document.getElementById('form-usuario').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('u-email').value;
        const senha = document.getElementById('u-senha').value;
        const perfil = document.getElementById('u-perfil').value;

        try {
            // Criamos uma segunda instância temporária do Firebase para não deslogar o admin atual
            const appTemp = initializeApp(auth.app.options, "tempApp" + Date.now());
            const { getAuth: getAuthTemp, createUserWithEmailAndPassword: createUserTemp, signOut: signOutTemp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
            const authTemp = getAuthTemp(appTemp);

            const cred = await createUserTemp(authTemp, email, senha);
            const uid = cred.user.uid;

            // Salva o perfil correspondente no Firestore na coleção 'usuarios'
            await setDoc(doc(db, "usuarios", uid), {
                email: email,
                perfil: perfil,
                criadoEm: new Date()
            });

            // Encerra a sessão da instância temporária
            await signOutTemp(authTemp);

            alert("Usuário criado com sucesso!");
            document.getElementById('form-usuario').reset();
        } catch (error) {
            alert("Erro ao criar usuário: " + error.message);
        }
    };

    // Tempo Real (Escutar tabelas)
    const monitorar = (colecao, tabelaId, render) => {
        onSnapshot(query(collection(db, colecao), orderBy("criadoEm", "desc")), (snap) => {
            const tab = document.getElementById(tabelaId);
            if (!tab) return;
            tab.innerHTML = "";
            snap.forEach(d => tab.innerHTML += render(d.data()));
        });
    };

    monitorar('clientes', 'tabela-clientes', (d) => `<tr class="border-b hover:bg-slate-50"><td class="p-2 font-medium">${d.nome}</td><td class="p-2">${d.telefone}</td><td class="p-2">${d.endereco}</td></tr>`);
    monitorar('entregadores', 'tabela-entregadores', (d) => `<tr class="border-b hover:bg-slate-50"><td class="p-2 font-medium">${d.nome}</td><td class="p-2">${d.telefone}</td></tr>`);
    monitorar('veiculos', 'tabela-veiculos', (d) => `<tr class="border-b hover:bg-slate-50"><td class="p-2 font-medium">${d.modelo}</td><td class="p-2">${d.placa}</td></tr>`);
    monitorar('usuarios', 'tabela-usuarios', (d) => `<tr class="border-b hover:bg-slate-50"><td class="p-2 font-medium">${d.email}</td><td class="p-2 uppercase text-xs font-bold text-amber-600">${d.perfil}</td></tr>`);
}
