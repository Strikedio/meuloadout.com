# Escreva um programa que pergunte a quantidade de km percorridos por um carro alugado
# e a quantidade de dias pelos quais ele foi alugado. calcule o preço  a pagar, sabendo que 
# o carro custa R$60 por dia e R$0,15 por km rodado.

kilometros = float(input('Digite a quantidade de kilometros percorridos: '))
km = float(input('Digite o valor a cobrar por cada km percorrido: '))
dias = int(input('Digite a quantidade de Dias que alugou o carro: '))
diaria = float(input('Digite o valor a ser cobrado pelas diarias: ')) 
if kilometros > 1000:
    ecedente = (kilometros - 1000) * km
else:
    ecedente = kilometros * 0
pago = (dias * diaria) + ecedente
print('O valor a pagar pelo aluguel do carro é R${:.2f}.'.format(pago))
