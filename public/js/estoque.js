document.addEventListener('DOMContentLoaded', () => {
    const inventoryTableBody = document.querySelector('#inventoryTable tbody');

    const loadInventory = () => {
        const credentials = localStorage.getItem('auth'); // Obtém as credenciais armazenadas

        fetch('http://localhost:3000/inventory', {
            method: 'GET',
            headers: {
                'Authorization': `Basic ${credentials}` // Inclui as credenciais de autenticação básica na requisição
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta da rede');
            }
            return response.json();
        })
        .then(data => {
            console.log(data);
            inventoryTableBody.innerHTML = ''; // Limpar tabela existente
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(item => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${item.equipment}</td>
                        <td>${item.new}</td>
                        <td>${item.semi_novo || item.seminew || 0}</td>
                        <td>${item.total}</td>
                    `;
                    inventoryTableBody.appendChild(row);
                });
            } else {
                inventoryTableBody.innerHTML = '<tr><td colspan="4">Nenhum dado disponível</td></tr>';
            }
        })
        .catch(error => {
            console.error('Erro ao carregar dados do estoque:', error);
            inventoryTableBody.innerHTML = '<tr><td colspan="4">Erro ao carregar dados do estoque</td></tr>';
        });
    };

    loadInventory(); // Carregar estoque ao iniciar

    // Atualização periódica a cada 5 minutos
    // setInterval(loadInventory, 5 * 60 * 1000);
});