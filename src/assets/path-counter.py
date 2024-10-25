import csv
from collections import Counter

path_counter = Counter()

with open('repOrder.csv', 'r') as file:
    reader = csv.reader(file, delimiter=';')
    for row in reader:
        path = list(map(int, row[:4]))

        for i in range(3):
            start, end = path[i], path[i+1]
            path_counter[(start, end)] += 1

for path, count in path_counter.items():
    print(f"Path {path} was used {count} times.")