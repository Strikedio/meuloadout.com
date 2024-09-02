# Aula sobre import. e from.


from math import sqrt   #Use o from para importar algo expecifico dentro da biblioteca desejada. 
num = int(input('Digite um numero: '))
raiz = sqrt(num)
print('a raiz de {} é igual a {}.'.format(num, raiz))

import math # Apenas import, use para importar todos os elementos da biblioteca. 
num = int(input('Digite um numero: '))
raiz = sqrt(num)    
print('A raiz de {} é igaul a {}.'.format(num, raiz))