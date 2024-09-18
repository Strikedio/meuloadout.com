document.getElementById('formEspecificacoes').addEventListener('submit', function(event) {
    event.preventDefault();

    const processador = document.getElementById('processador').value;
    const memoria = document.getElementById('memoria').value;
    const armazenamento = document.getElementById('armazenamento').value;

    const resultadoDiv = document.getElementById('resultado');
    resultadoDiv.innerHTML = `
        <h3>Especificações Salvas:</h3>
        <p>Processador: ${processador}</p>
        <p>Memória RAM: ${memoria}</p>
        <p>Armazenamento: ${armazenamento}</p>
    `;
    
    this.reset(); // Limpa o formulário
});
