# Faca um programa que leia algo pelo teclado e mostra na tela
# o seu tupo primitivo e todas as informacoes possiveis sobre ele.
n = input('Escreva algo ')
print('O tipo primitivo de {} é '.format(n), type(n))
print('So tem espaços? ', n.isspace())
print('É um numero? ', n.isnumeric())
print('É alfabetico? ', n.isalpha())
print('É alfanumerico? ', n.isalnum())
print('Esta em maiusculas? ', n.isupper())
print('Esta em minusculas? ', n.islower())
print('Esta capitalizada? ', n.istitle())
