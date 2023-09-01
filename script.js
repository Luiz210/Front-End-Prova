const apiUrl = 'https://localhost:7056';

const comprarButton = document.getElementById('comprar');
const venderButton = document.getElementById('vender');
const pesquisarButton = document.getElementById('pesquisar');
const contentDiv = document.getElementById('content');
const ativoInput = document.getElementById('ativo');

let inputValue = '';
let inputLocked = false;
let ativo = null;

function returnButton() {
    const voltarButton = document.getElementById('voltar');
    voltarButton.addEventListener('click', () => {
       let input = document.getElementById('ativo');
        input.value='';
        contentDiv.innerHTML = '';
        ativoInput.disabled = false;
        inputLocked = false;
        resetButtonsPosition();
    });
}

function calcularSaldo(orders) {
    let saldo = 0;
    for (const order of orders) {
        if (order.type === 1) { 
            saldo += order.price;
        } else if (order.type === 2) { 
            saldo -= order.price;
        }
    }
    return saldo;
}

function mostrarBotaoVoltar() {
        contentDiv.innerHTML = '';
        resetButtonsPosition();
}

function mostrarMensagemErro(mensagem) {
    contentDiv.innerHTML = `
        <p>${mensagem}</p>
        <button id="voltar">Voltar</button>`;
    returnButton();
}

function resetButtonsPosition() {
    comprarButton.style.display = 'block';
    venderButton.style.display = 'block';
    pesquisarButton.style.display = 'block';
}

function desableButtons() {
    venderButton.style.display = 'none';
    comprarButton.style.display = 'none';
    pesquisarButton.style.display = 'none';
}

function exibirFormulario(tipo) {
    const titulo = tipo === 'compra' ? 'PAG 1' : 'PAG 2';
    contentDiv.innerHTML = `
    <h1>${titulo}</h1>
    <p>Valor do Ativo: ${ativo ? ativo.price : ''}</p>
    <div id="error-message"></div> 
    <input id="quantidade" type="number" placeholder="Quantidade">
    <p id="resultado">Valor da Ordem: R$ 0.00</p>
    <button id="confirmar">Confirmar</button>
    <button id="voltar" onclick="mostrarBotaoVoltar()">voltar</button>
`;
    const confirmarButton = document.getElementById('confirmar');
    const quantidadeInput = document.getElementById('quantidade');
    const resultadoElement = document.getElementById('resultado');

    quantidadeInput.addEventListener('input', () => {
        const errorMessage = document.getElementById('error-message');
    errorMessage.textContent = '';
        const quantidade = parseFloat(quantidadeInput.value);
        if (!isNaN(quantidade) && ativo && ativo.price) {
            const resultado = quantidade * ativo.price;
            resultadoElement.textContent = `Resultado: R$ ${resultado.toFixed(2)}`;
        } else {
            resultadoElement.textContent = 'Resultado: R$ 0.00';
        }
    });

    confirmarButton.addEventListener('click', async () => {
        const quantidade = parseFloat(quantidadeInput.value);
        if (isNaN(quantidade) || quantidade <= 0) {
            const errorMessage = document.getElementById('error-message');
            errorMessage.textContent = 'Por favor, insira uma quantidade válida.';
            return;
        }
        if (!isNaN(quantidade) && ativo) {
            const infoUrl = `${apiUrl}/api/controller/byCode?code=${inputValue}`;
            try {
                const infoResponse = await fetch(infoUrl);
                if (infoResponse.ok) {
                    const infoData = await infoResponse.json();
                    ativo.price = infoData.price;
                } else {
                    mostrarMensagemErro('Erro ao buscar informações do ativo.');
                    return;
                }
            } catch (error) {
                mostrarMensagemErro('Ocorreu um erro na solicitação de informações do ativo.');
                return;
            }
            const resultado = ativo.price * quantidade;
            const orderData = {
                code: { id: 0, code: ativo.code, price: ativo.price },
                type: tipo === 'compra' ? 1 : 2,
                qntd: quantidade,
                price: resultado,
                date: new Date().toISOString()
            };
            try {
                const url = `${apiUrl}/api/Order/ByCode?code=${ativo.code}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(orderData)
                });
                if (response.ok) {
                    contentDiv.innerHTML += `<p>Ordem de ${tipo} criada com sucesso. Resultado: ${resultado}</p>`;
                } else {
                    contentDiv.innerHTML += `<p>Erro ao criar ordem de ${tipo}.</p>`;
                }
            } catch (error) {
                contentDiv.innerHTML += '<p>Ocorreu um erro na solicitação.</p>';
            }
        }
    });
    returnButton();
}

venderButton.addEventListener('click', async () => {
    desableButtons();
    if (!inputLocked) {
        inputValue = ativoInput.value;
        inputLocked = true;
        ativoInput.disabled = true;
    }
    try {
        const response = await fetch(`${apiUrl}/api/controller/byCode?code=${inputValue}`);
        if (response.ok) {
            ativo = await response.json();
            exibirFormulario('venda');
        } else {
            mostrarMensagemErro(`Ativo ${inputValue} invalido.`);
        }
    } catch (error) {
        mostrarMensagemErro('Ocorreu um erro na solicitação.');
    }
});

comprarButton.addEventListener('click', async () => {
    desableButtons();

    if (!inputLocked) {
        inputValue = ativoInput.value;
        inputLocked = true;
        ativoInput.disabled = true;
    }
    try {
        const response = await fetch(`${apiUrl}/api/controller/byCode?code=${inputValue}`);
        if (response.ok) {
            ativo = await response.json();
            exibirFormulario('compra');
        }else  {
            mostrarMensagemErro(`Ativo ${inputValue} invalido.`);
        }
    } catch (error) {
        mostrarMensagemErro('Ocorreu um erro na solicitação.');
    }
});

pesquisarButton.addEventListener('click', async () => {
    desableButtons();
    const inputCode = ativoInput.value.trim();
    if (inputCode === '') {
        mostrarMensagemErro('Por favor, insira um Ativo válido.');
        return;
    }
    try {
        const response = await fetch(`${apiUrl}/api/Order?code=${inputCode}`);
        if (response.ok) {
            const orders = await response.json();
            const filteredOrders = orders.filter(order => order.code && order.code.code === inputCode);

            if (filteredOrders.length > 0) {
                contentDiv.innerHTML = '<h1>Ordens Armazenadas:</h1>';
                filteredOrders.forEach(order => {
                    let date =  new Date(order.date).toLocaleDateString();
                    contentDiv.innerHTML += `
                        <p>Tipo: ${order.type === 1 ? 'Compra' : 'Venda'}:${order.qntd} unidades,
                        ${order.code ? order.code.code : 'N/A'},${order.price}, Data: ${date}</p>
                    `;
                });
                const saldo = calcularSaldo(filteredOrders);
                contentDiv.innerHTML += `<p>Saldo Total: R$ ${saldo.toFixed(2)}</p>`;
                contentDiv.innerHTML += '<button id="voltar">Voltar</button>';
                returnButton();
            } else {
                contentDiv.innerHTML = `<p>Não foram encontradas ordens armazenadas para o Ativo ${inputCode}.</p>`;
                mostrarBotaoVoltar();
            }
        } else {
            mostrarMensagemErro('Erro ao buscar ordens armazenadas.');
        }
    } catch (error) {
        mostrarMensagemErro('Ocorreu um erro na solicitação.');
    }
});

