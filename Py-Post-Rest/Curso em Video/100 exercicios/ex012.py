# Faça um algoritimo que leia o preço de um produto e mostre seu novo preço, com 5% de desconto.
produto = float(input('qual o valor do produto? '))
porcentagem = (produto * 5/100)
print('com desconto de 5%, este produto sera vandido por {}!'.format(produto - porcentagem))