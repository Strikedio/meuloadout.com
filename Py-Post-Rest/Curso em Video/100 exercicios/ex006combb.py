# importar somente a somatoria de raiz de dentro da biblioteca math

from math import sqrt

num = int(input('Digite um numero: '))
raiz = sqrt(num)
print('O dobro de {}, vale {}. \nO triplo de {}, vale {}. \nE a raiz quadrada de {}, vale {:.2f}.'.format(num, num*2, num, num*3, num, raiz))


#n = int(input('Digite um numero = '))
#print('O seu dobro é {},\nO triplo é {},\nE sua raiz quadrada {:.2f}.'.format(n*2, n*3, n**(1/2)))
