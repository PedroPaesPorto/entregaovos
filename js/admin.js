import { db, auth } from './firebase-init.js';
import { collection, addDoc, onSnapshot, query, orderBy, doc, setDoc, getDocs, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

export function renderizarPainelAdmin(conteudoDiv, emailUsuario) {
    conteudoDiv.innerHTML = `
        <div class="mb-6 flex justify-between items-center border-b pb-4">
            <div>
                <h3 class="font-semibold text-lg text-amber-600">Painel Administrativo</h3>
                <p class="text-sm text-slate-500">Gerencie estoque, entregas, cadastros e acessos.</p>
            </div>
            <span class="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-semibold">Admin</span>
        </div>

        <!-- Abas Internas do Admin -->
        <div class="flex gap-4 border-b mb-6 text-sm overflow-x-auto">
            <button onclick="mudarAbaAdmin('estoque')" id="btn-aba-estoque" class="pb-2 font-medium text-amber-600 border-b-2 border-amber-600 transition-all">Estoque</button>
            <button onclick="mudarAbaAdmin('entregas')" id="btn-aba-entregas" class="pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all">Entregas & Mapa</button>
            <button onclick="mudarAbaAdmin('clientes')" id="btn-aba-clientes" class="pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all">Clientes</button>
            <button onclick="mudarAbaAdmin('entregadores')" id="btn-aba-entregadores" class="pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all">Entregadores</button>
            <button onclick="mudarAbaAdmin('veiculos')" id="btn-aba-veiculos" class="pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all">Veículos</button>
            <button onclick="mudarAbaAdmin('usuarios')" id="btn-aba-usuarios" class="pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all">Usuários</button>
        </div>

        <!-- SEÇÃO ESTOQUE (NOVO) -->
        <div id="secao-estoque" class="space-y-6">
            <!-- Saldo Atual -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 flex justify-between items-center">
                    <div>
                        <p class="text-xs font-bold text-amber-800 uppercase">Estoque Ovos Brancos</p>
                        <h3 id="saldo-branco" class="text-2xl font-bold text-amber-900">0 cartelas</h3>
                    </div>
                    <span class="text-3xl">🥚</span>
                </div>
                <div class="bg-rose-50 p-4 rounded-xl border border-rose-200 flex justify-between items-center">
                    <div>
                        <p class="text-xs font-bold text-rose-800 uppercase">Estoque Ovos Vermelhos</p>
                        <h3 id="saldo-vermelho" class="text-2xl font-bold text-rose-900">0 cartelas</h3>
                    </div>
                    <span class="text-3xl">🥚</span>
                </div>
            </div>

            <div class="bg-slate-50 p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Registrar Entrada de Ovos (Fornecedor)</h4>
                <form id="form-estoque-entrada" class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select id="est-tipo" required class="px-3 py-2 border rounded-lg bg-white text-sm">
                        <option value="branco">Ovos Brancos</option>
                        <option value="vermelho">Ovos Vermelhos</option>
                    </select>
                    <input type="number" id="est-qtd" placeholder="Qtd de Cartelas" min="1" required class="px-3 py-2 border rounded-lg bg-white text-sm">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-all">Adicionar ao Estoque</button>
                </form>
            </div>
        </div>

        <!-- SEÇÃO ENTREGAS & MAPA -->
        <div id="secao-entregas" class="space-y-6 hidden">
            <div class="bg-slate-50 p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Lançar Nova Entrega</h4>
                <form id="form-entrega" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
                        <select id="en-cliente" required class="w-full px-3 py-2 border rounded-lg bg-white text-sm"></select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Entregador</label>
                        <select id="en-entregador" required class="w-full px-3 py-2 border rounded-lg bg-white text-sm"></select>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-slate-500 mb-1">Veículo</label>
                        <select id="en-veiculo" required class="w-full px-3 py-2 border rounded-lg bg-white text-sm"></select>
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                        <div>
                            <label class="block text-xs font-medium text-slate-500 mb-1">Cartelas Brancas</label>
                            <input type="number" id="en-branco" min="0" value="0" required class="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-slate-500 mb-1">Cartelas Vermelhas</label>
                            <input type="number" id="en-vermelho" min="0" value="0" required class="w-full px-3 py-2 border rounded-lg bg-white text-sm">
                        </div>
                    </div>
                    <button type="submit" class="md:col-span-2 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-all">Lançar Entrega e Rota</button>
                </form>
            </div>

            <!-- Mapa OpenStreetMap -->
            <div class="bg-white p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Mapa de Rotas & Clientes (Porto Velho)</h4>
                <div id="map" class="w-full h-96 rounded-lg z-0"></div>
            </div>

            <div class="overflow-x-auto bg-white p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Entregas Lançadas</h4>
                <table class="w-full text-sm text-left border-collapse">
                    <thead><tr class="border-b text-slate-400"><th class="p-2">Cliente</th><th class="p-2">Entregador</th><th class="p-2">Branco / Vermelho</th><th class="p-2">Status</th><th class="p-2">Ações</th></tr></thead>
                    <tbody id="tabela-entregas"></tbody>
                </table>
            </div>
        </div>

        <!-- SEÇÃO CLIENTES -->
        <div id="secao-clientes" class="space-y-6 hidden">
            <div class="bg-slate-50 p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Novo Cliente</h4>
                <form id="form-cliente" class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input type="text" id="c-nome" placeholder="Nome" required class="px-3 py-2 border rounded-lg bg-white">
                    <input type="text" id="c-tel" placeholder="Telefone" required class="px-3 py-2 border rounded-lg bg-white">
                    <input type="text" id="c-end" placeholder="Endereço Completo (ex: Av. Carlos Gomes, Porto Velho)" required class="md:col-span-2 px-3 py-2 border rounded-lg bg-white">
                    <button type="submit" class="bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-all">Salvar Cliente</button>
                </form>
            </div>
            <div class="overflow-x-auto bg-white p-4 rounded-xl border">
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
            <div class="overflow-x-auto bg-white p-4 rounded-xl border">
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
            <div class="overflow-x-auto bg-white p-4 rounded-xl border">
                <table class="w-full text-sm text-left border-collapse">
                    <thead><tr class="border-b text-slate-400"><th class="p-2">Modelo</th><th class="p-2">Placa</th></tr></thead>
                    <tbody id="tabela-veiculos"></tbody>
                </table>
            </div>
        </div>

        <!-- SEÇÃO USUÁRIOS -->
        <div id="secao-usuarios" class="space-y-6 hidden">
            <div class="bg-slate-50 p-4 rounded-xl border">
                <h4 class="font-medium text-slate-700 mb-3">Cadastrar Usuário do Sistema</h4>
                <form id="form-usuario" class="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input type="email" id="u-email" placeholder="E-mail" required class="px-3 py-2 border rounded-lg bg-white">
                    <input type="password" id="u-senha" placeholder="Senha (mín. 6 caracteres)" required class="px-3 py-2 border rounded-lg bg-white">
                    <select id="u-perfil" class="px-3 py-2 border rounded-lg bg-white text-slate-700">
                        <option value="entregador">Entregador</option>
                        <option value="financeiro">Financeiro</option>
                        <option value="admin">Administrador</option>
                    </select>
                    <button type="submit" class="md:col-span-3 bg-amber-600 hover:bg-amber-700 text-white font-medium px-4 py-2 rounded-lg transition-all">Criar Acesso</button>
                </form>
            </div>
            <div class="overflow-x-auto bg-white p-4 rounded-xl border">
                <table class="w-full text-sm text-left border-collapse">
                    <thead><tr class="border-b text-slate-400"><th class="p-2">E-mail</th><th class="p-2">Perfil</th></tr></thead>
                    <tbody id="tabela-usuarios"></tbody>
                </table>
            </div>
        </div>
    `;

    // Inicialização do Mapa Leaflet
    let map = L.map('map').setView([-8.7619, -63.9039], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let markersLayer = L.layerGroup().addTo(map);

    // Alternar Abas
    window.mudarAbaAdmin = (aba) => {
        ['estoque', 'entregas', 'clientes', 'entregadores', 'veiculos', 'usuarios'].forEach(a => {
            document.getElementById(`secao-${a}`).classList.toggle('hidden', a !== aba);
            document.getElementById(`btn-aba-${a}`).className = (a === aba) 
                ? "pb-2 font-medium text-amber-600 border-b-2 border-amber-600 transition-all" 
                : "pb-2 font-medium text-slate-500 hover:text-amber-600 transition-all";
        });
        if (aba === 'entregas') {
            setTimeout(() => map.invalidateSize(), 200);
        }
    };

    // Preencher Selects
    async function carregarOpcoesSelects() {
        const cSelect = document.getElementById('en-cliente');
        const eSelect = document.getElementById('en-entregador');
        const vSelect = document.getElementById('en-veiculo');
        if (!cSelect) return;

        cSelect.innerHTML = '<option value="">Selecione um cliente</option>';
        eSelect.innerHTML = '<option value="">Selecione um entregador</option>';
        vSelect.innerHTML = '<option value="">Selecione um veículo</option>';

        const cSnap = await getDocs(collection(db, 'clientes'));
        cSnap.forEach(docSnap => {
            const data = docSnap.data();
            cSelect.innerHTML += `<option value="${data.nome}">${data.nome} (${data.endereco})</option>`;
        });

        const eSnap = await getDocs(collection(db, 'entregadores'));
        eSnap.forEach(docSnap => {
            const data = docSnap.data();
            eSelect.innerHTML += `<option value="${data.nome}">${data.nome}</option>`;
        });

        const vSnap = await getDocs(collection(db, 'veiculos'));
        vSnap.forEach(docSnap => {
            const data = docSnap.data();
            vSelect.innerHTML += `<option value="${data.modelo} - ${data.placa}">${data.modelo} (${data.placa})</option>`;
        });
    }

    carregarOpcoesSelects();

    // Calcular e atualizar Estoque em Tempo Real
    onSnapshot(collection(db, 'estoque_mov'), (snap) => {
        let saldoB = 0;
        let saldoV = 0;
        snap.forEach(doc => {
            const m = doc.data();
            if (m.tipo === 'branco') {
                saldoB += m.quantidade * (m.operacao === 'entrada' ? 1 : -1);
            } else if (m.tipo === 'vermelho') {
                saldoV += m.quantidade * (m.operacao === 'entrada' ? 1 : -1);
            }
        });
        const elB = document.getElementById('saldo-branco');
        const elV = document.getElementById('saldo-vermelho');
        if (elB) elB.textContent = `${saldoB} cartelas`;
        if (elV) elV.textContent = `${saldoV} cartelas`;
    });

    // Registrar Entrada no Estoque
    document.getElementById('form-estoque-entrada').onsubmit = async (e) => {
        e.preventDefault();
        const tipo = document.getElementById('est-tipo').value;
        const quantidade = parseInt(document.getElementById('est-qtd').value);
        try {
            await addDoc(collection(db, 'estoque_mov'), {
                tipo,
                quantidade,
                operacao: 'entrada',
                motivo: 'Compra fornecedor',
                criadoEm: new Date()
            });
            document.getElementById('form-estoque-entrada').reset();
            alert("Entrada registrada com sucesso!");
        } catch (err) {
            alert("Erro: " + err.message);
        }
    };

    // Cadastros básicos
    document.getElementById('form-cliente').onsubmit = async (e) => { 
        e.preventDefault(); 
        const nome = document.getElementById('c-nome').value;
        const telefone = document.getElementById('c-tel').value;
        const endereco = document.getElementById('c-end').value;
        let lat = -8.7619, lng = -63.9039;
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endereco + ", Porto Velho, RO")}`);
            const data = await res.json();
            if (data && data.length > 0) { lat = parseFloat(data[0].lat); lng = parseFloat(data[0].lon); }
        } catch (err) {}
        await addDoc(collection(db, 'clientes'), { nome, telefone, endereco, lat, lng, criadoEm: new Date() });
        document.getElementById('form-cliente').reset();
        carregarOpcoesSelects();
        alert("Cliente cadastrado!");
    };

    document.getElementById('form-entregador').onsubmit = async (e) => { 
        e.preventDefault(); 
        await addDoc(collection(db, 'entregadores'), { nome: document.getElementById('e-nome').value, telefone: document.getElementById('e-tel').value, criadoEm: new Date() });
        document.getElementById('form-entregador').reset();
        carregarOpcoesSelects();
        alert("Entregador cadastrado!");
    };
    
    document.getElementById('form-veiculo').onsubmit = async (e) => { 
        e.preventDefault(); 
        await addDoc(collection(db, 'veiculos'), { modelo: document.getElementById('v-modelo').value, placa: document.getElementById('v-placa').value, criadoEm: new Date() });
        document.getElementById('form-veiculo').reset();
        carregarOpcoesSelects();
        alert("Veículo cadastrado!");
    };

    // Lançar Entrega
    document.getElementById('form-entrega').onsubmit = async (e) => {
        e.preventDefault();
        try {
            await addDoc(collection(db, 'entregas'), {
                cliente: document.getElementById('en-cliente').value,
                entregador: document.getElementById('en-entregador').value,
                veiculo: document.getElementById('en-veiculo').value,
                branco: parseInt(document.getElementById('en-branco').value),
                vermelho: parseInt(document.getElementById('en-vermelho').value),
                status: 'Pendente',
                criadoEm: new Date()
            });
            document.getElementById('form-entrega').reset();
            alert("Entrega lançada com sucesso!");
        } catch (err) {
            alert("Erro ao lançar entrega: " + err.message);
        }
    };

    // Funções globais para Ações nas Entregas (Concluir com Avarias ou Cancelar)
    window.concluirEntrega = async (id, branco, vermelho) => {
        const avariasBranco = parseInt(prompt("Quantas cartelas brancas tiveram avaria/quebra nesta entrega?", "0")) || 0;
        const avariasVermelho = parseInt(prompt("Quantas cartelas vermelhas tiveram avaria/quebra nesta entrega?", "0")) || 0;

        try {
            // Atualiza status da entrega
            const { doc: firestoreDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
            await updateDoc(firestoreDoc(db, 'entregas', id), { status: 'Concluída', avariasBranco, avariasVermelho });

            // Dá baixa líquida no estoque (quantidade entregue + avarias vão sair do estoque)
            if (branco > 0) {
                await addDoc(collection(db, 'estoque_mov'), { tipo: 'branco', quantidade: branco, operacao: 'saida', motivo: 'Entrega realizada', criadoEm: new Date() });
            }
            if (vermelho > 0) {
                await addDoc(collection(db, 'estoque_mov'), { tipo: 'vermelho', quantidade: vermelho, operacao: 'saida', motivo: 'Entrega realizada', criadoEm: new Date() });
            }

            alert("Entrega concluída e estoque baixado com sucesso!");
        } catch (err) {
            alert("Erro ao concluir: " + err.message);
        }
    };

    window.cancelarEntrega = async (id) => {
        if (confirm("Tem certeza que deseja cancelar esta entrega?")) {
            try {
                const { doc: firestoreDoc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
                await updateDoc(firestoreDoc(db, 'entregas', id), { status: 'Cancelada' });
                alert("Entrega cancelada.");
            } catch (err) {
                alert("Erro ao cancelar: " + err.message);
            }
        }
    };

    // Criar Usuário
    document.getElementById('form-usuario').onsubmit = async (e) => {
        e.preventDefault();
        const email = document.getElementById('u-email').value;
        const senha = document.getElementById('u-senha').value;
        const perfil = document.getElementById('u-perfil').value;

        try {
            const appTemp = initializeApp(auth.app.options, "tempApp" + Date.now());
            const { getAuth: getAuthTemp, createUserWithEmailAndPassword: createUserTemp, signOut: signOutTemp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js");
            const authTemp = getAuthTemp(appTemp);

            const cred = await createUserTemp(authTemp, email, senha);
            await setDoc(doc(db, "usuarios", cred.user.uid), { email, perfil, criadoEm: new Date() });
            await signOutTemp(authTemp);

            alert("Usuário criado com sucesso!");
            document.getElementById('form-usuario').reset();
        } catch (error) {
            alert("Erro: " + error.message);
        }
    };

    // Monitores em Tempo Real
    const monitorar = (colecao, tabelaId, render) => {
        onSnapshot(query(collection(db, colecao), orderBy("criadoEm", "desc")), (snap) => {
            const tab = document.getElementById(tabelaId);
            if (!tab) return;
            tab.innerHTML = "";
            snap.forEach(d => tab.innerHTML += render(d.data(), d.id));
        });
    };

    monitorar('clientes', 'tabela-clientes', (d) => `<tr class="border-b hover:bg-slate-50"><td class="p-2 font-medium">${d.nome}</td><td class="p-2">${d.telefone}</td><td class="p-2">${d.endereco}</td></tr>`);
    monitorar('entregadores', 'tabela-entregadores', (d) => `<tr class="border-b hover:bg-slate-50"><td class="p-2 font-medium">${d.nome}</td><td class="p-2">${d.telefone}</td></tr>`);
    monitorar('veiculos', 'tabela-veiculos', (d) => `<tr class="border-b hover:bg-slate-50"><td class="p-2 font-medium">${d.modelo}</td><td class="p-2">${d.placa}</td></tr>`);
    monitorar('usuarios', 'tabela-usuarios', (d) => `<tr class="border-b hover:bg-slate-50"><td class="p-2 font-medium">${d.email}</td><td class="p-2 uppercase text-xs font-bold text-amber-600">${d.perfil}</td></tr>`);
    
    onSnapshot(query(collection(db, 'entregas'), orderBy("criadoEm", "desc")), async (snap) => {
        const tab = document.getElementById('tabela-entregas');
        if (!tab) return;
        tab.innerHTML = "";
        
        snap.forEach(d => {
            const data = d.data();
            const id = d.id;
            let badgeColor = 'bg-yellow-100 text-yellow-800';
            if (data.status === 'Concluída') badgeColor = 'bg-green-100 text-green-800';
            if (data.status === 'Cancelada') badgeColor = 'bg-red-100 text-red-800';

            let acoes = '';
            if (data.status === 'Pendente') {
                acoes = `
                    <button onclick="concluirEntrega('${id}', ${data.branco}, ${data.vermelho})" class="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded mr-1">Concluir</button>
                    <button onclick="cancelarEntrega('${id}')" class="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 rounded">Cancelar</button>
                `;
            } else {
                acoes = `<span class="text-xs text-slate-400">Finalizada</span>`;
            }

            tab.innerHTML += `
                <tr class="border-b hover:bg-slate-50">
                    <td class="p-2 font-medium">${data.cliente}</td>
                    <td class="p-2">${data.entregador}</td>
                    <td class="p-2">${data.branco} Brancos / ${data.vermelho} Vermelhos</td>
                    <td class="p-2"><span class="${badgeColor} text-xs px-2 py-0.5 rounded font-semibold">${data.status}</span></td>
                    <td class="p-2">${acoes}</td>
                </tr>`;
        });

        markersLayer.clearLayers();
        const clientesSnap = await getDocs(collection(db, 'clientes'));
        clientesSnap.forEach(cliDoc => {
            const c = cliDoc.data();
            if (c.lat && c.lng) {
                L.marker([c.lat, c.lng]).addTo(markersLayer).bindPopup(`<b>${c.nome}</b><br>${c.endereco}`);
            }
        });
    });
}
