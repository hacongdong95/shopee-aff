import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create admin
  const hashed = await bcrypt.hash('admin123', 10)
  await prisma.admin.upsert({
    where: { email: 'admin@shopeeaff.com' },
    update: {},
    create: { email: 'admin@shopeeaff.com', password: hashed },
  })

  // Create categories
  const cats = [
    { name: 'Điện tử', slug: 'dien-tu' },
    { name: 'Thời trang', slug: 'thoi-trang' },
    { name: 'Nhà cửa', slug: 'nha-cua' },
    { name: 'Làm đẹp', slug: 'lam-dep' },
    { name: 'Thể thao', slug: 'the-thao' },
  ]
  for (const cat of cats) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    })
  }

  // Sample products
  const dienTu = await prisma.category.findUnique({ where: { slug: 'dien-tu' } })
  if (dienTu) {
    await prisma.product.upsert({
      where: { slug: 'tai-nghe-bluetooth-mau-1' },
      update: {},
      create: {
        name: 'Tai nghe Bluetooth Pro X1',
        slug: 'tai-nghe-bluetooth-mau-1',
        description: 'Tai nghe chống ồn, pin 30h, kết nối Bluetooth 5.0',
        price: 299000,
        oldPrice: 450000,
        imageUrl: 'https://placehold.co/400x400/ff6b35/white?text=Tai+nghe',
        affLink: 'https://shope.ee/example',
        categoryId: dienTu.id,
      },
    })
  }

  console.log('Seed done!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
