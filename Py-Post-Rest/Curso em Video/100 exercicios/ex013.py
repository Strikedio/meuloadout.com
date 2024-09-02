# Faça um algoritimo que leia o salario de um funcionario e mostre seu novo salario, com 15% de aumento.

salario = float(input('Qual o salario atual do funcionario? '))
novo = salario + (salario * 15/100)
print('O salario com almento de 15%, ficara em {:.2f}.'.format(novo))