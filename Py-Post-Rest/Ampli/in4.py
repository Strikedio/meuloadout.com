# estrutura condicional usando operadores booleanos.
# um aluno so pode ser aprovado caso ele tenha menos de 5 faltas
# e media final superior a 7

contador = 1
while contador <= 3:
    faltas = int(input('Digite a quantidade de faltas: '))
    media = float(input('Digite a média final: '))
    if faltas <= 5 and media >= 7:
        print('Aluno aprovado!')
    else:
        print('Aluno Reprovado')
    contador = contador + 1
