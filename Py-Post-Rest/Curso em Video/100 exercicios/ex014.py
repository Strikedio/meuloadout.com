# Escreva um programa que converta uma temperatura ditada em graus ceulcios e converta para F
c = float(input('Informe a temperatura em Celcios: '))
f = ((9*c)/5)+32 #formula para calcular farenheit
print('A temperatura de {} C corresponde a {} F.'.format(c, f))