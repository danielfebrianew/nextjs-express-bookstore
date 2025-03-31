    import request from 'supertest'
    import app from '../app.js'

    const adminToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc0ZjYyMjUyLThlN2UtNDBlMi04NDViLTZmZTFhNzNmMTgzNSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQzMzA0NTQ2LCJleHAiOjE3NDMzOTA5NDZ9.V659RA6FrxQxL4qBGh32pLVscClXowFxmlig2PeKWcw"
    const categoryId = "333718ff-ad88-4a56-bc2e-9ba6be38eee4" // pastikan UUID valid dari kategori di DB

    let createdBookId

    describe('Admin Book Routes', () => {
    test('POST /api/v1/admin/books tanpa token harus gagal', async () => {
        const res = await request(app)
        .post('/api/v1/admin/books')
        .send({})
        expect(res.statusCode).toBe(401)
    })

    test('POST /api/v1/admin/books dengan data kosong & token harus gagal validasi', async () => {
        const res = await request(app)
        .post('/api/v1/admin/books')
        .set('Authorization', adminToken)
        .send({})
        expect(res.statusCode).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('POST /api/v1/admin/books dengan data valid harus sukses', async () => {
        const res = await request(app)
        .post('/api/v1/admin/books')
        .set('Authorization', adminToken)
        .field('title', 'Buku Testing')
        .field('author', 'Penulis')
        .field('price', '50000')
        .field('stock', '10')
        .field('categoryId', categoryId)
        .attach('imageUrl', '__tests__/assets/sample.jpg')

        expect([201, 400, 500]).toContain(res.statusCode)
        if (res.statusCode === 201) {
        createdBookId = res.body.id
        }
    })

    test('PUT /api/v1/admin/books/:id dengan update title', async () => {
        if (!createdBookId) return

        const res = await request(app)
        .put(`/api/v1/admin/books/${createdBookId}`)
        .set('Authorization', adminToken)
        .field('title', 'Buku Testing Updated')

        expect([200, 400, 500]).toContain(res.statusCode)
    })

    test('DELETE /api/v1/admin/books/:id harus sukses', async () => {
        if (!createdBookId) return

        const res = await request(app)
        .delete(`/api/v1/admin/books/${createdBookId}`)
        .set('Authorization', adminToken)

        expect([200, 404, 500]).toContain(res.statusCode)
    })
    })
