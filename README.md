# Brooke's Reading Room

An interactive 3D study and a separate literary bookshelf for Brooke.

## Local preview

Run a static server from the project directory, then open:

- Main 3D room: `http://127.0.0.1:4173/`
- Reading room: `http://127.0.0.1:4173/bookshelf/`

The bookshelf is now self-contained inside `bookshelf/`. Its catalog lives in `bookshelf/books.tsv`, and its cover images live in `bookshelf/assets/covers/`.

To add a book, place its cover in that directory, append one row to the table, and refresh the reading-room page.

- Quick book guide: `bookshelf/BOOKS.md`
- Full deployment and maintenance handoff: `bookshelf/README.md`
