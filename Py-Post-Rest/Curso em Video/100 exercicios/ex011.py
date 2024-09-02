# Faça um programa que leia a largura e a altura de uma parede em metros, calcule a sua area e a quantidade de tinta necessaria para pinta-la, 
# sabendo que cada litro de tinra pinta uma area de 2m².

larg = float(input('Qual a largura da parede em metros? '))
alt = float(input('Qual a altura da parede em metros? '))
area = larg * alt
print('A area da parede é de {:.2f}, seram necesarias {:.2f} latas de tinta.'.format(area, area / 2))