# Escreva um programa que leia um valor em metros e o exiba convertido em centimetros e milimetros.

num = float(input('Digite a quantidade de metros: '))
mm = num * 1000
cm = num * 100
print('O valor convertido em centimetros é {}, e em milimetros é, {}.'.format(cm, mm))