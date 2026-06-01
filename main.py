# Algorithme pour créer 13 fichiers nommés text_1 à text_13
for i in range(1, 14):
    filename = f"text_{i}.txt"
    with open(filename, "w") as f:
        f.write(f"Contenu du fichier text_{i}\n")
    print(f"Fichier créé: {filename}")

print(" ✓ 13 fichiers créés avec succès !")