# Fichiers Sécurisés pour la Broderie Numérique

C'est ici que vous devez placer vos fichiers finaux (.DST, .PES, .JEF, etc.) qui seront vendus.
Ce dossier n'est **pas accessible** publiquement par vos visiteurs sur le site (ils ne peuvent pas deviner le lien).
Seul le script de vérification de paiement (`download-file.js`) y a accès.

**Comment nommer vos fichiers ?**
Le script s'attend à ce que le fichier porte le nom de son ID (numéro) suivi de son extension.
Par exemple, si le motif a l'ID `9` et que le format choisi est `DST`, le script cherchera le fichier :
`9.dst`

Vous devez donc avoir dans ce dossier des fichiers comme :
- `1.dst`
- `1.pes`
- `2.jef`
- `9.dst`
- etc.

Le script les renverra automatiquement en téléchargement une fois le paiement validé.
