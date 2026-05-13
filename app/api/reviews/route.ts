import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

// Hàm xử lý để review trông tự nhiên hơn, tránh lạm dụng sticker cuối câu
function cleanComment(text: string) {
  let comment = text.trim();
  const randomValue = Math.random();
  
  // Danh sách emoji phổ biến
  const emojis = ['👍', '👌', '🥰', '🤩', '💯', '🔥', '✨', '✅', '⭐'];
  const icon = emojis[Math.floor(Math.random() * emojis.length)];

  // 1. Tỉ lệ 40%: Xóa sạch sticker ở cuối câu để nhìn "thật" hơn
  if (randomValue < 0.4) {
    comment = comment.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/gu, '');
  } 
  // 2. Tỉ lệ 20%: Đưa sticker lên đầu câu thay vì cuối câu
  else if (randomValue < 0.6) {
    comment = comment.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]+$/gu, '');
    comment = `${icon} ${comment}`;
  }
  // 3. 40% còn lại giữ nguyên (có thể có sticker ở cuối do người dùng nhập)

  return comment.trim();
}

export async function GET(req: NextRequest) {
  const productId = req.nextUrl.searchParams.get('productId')
  if (productId) {
    const reviews = await prisma.review.findMany({
      where: { productId: Number(productId), isHidden: false },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(reviews)
  }
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    include: { product: { select: { name: true } } },
  })
  return NextResponse.json(reviews.map(r => ({
    id: r.id,
    productId: r.productId,
    productName: r.product.name,
    name: r.name,
    rating: r.rating,
    comment: r.comment,
    isHidden: r.isHidden,
    createdAt: r.createdAt,
  })))
}

export async function POST(req: NextRequest) {
  const { productId, name, rating, comment } = await req.json()
  if (!productId || !name?.trim() || !rating || !comment?.trim()) {
    return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
  }
  if (comment.trim().length < 10) {
    return NextResponse.json({ error: 'Đánh giá phải ít nhất 10 ký tự' }, { status: 400 })
  }

  // Áp dụng logic làm sạch nội dung trước khi lưu
  const processedComment = cleanComment(comment);

  const review = await prisma.review.create({
    data: {
      productId: Number(productId),
      name: name.trim(),
      rating: Number(rating),
      comment: processedComment,
      isHidden: false,
    },
  })
  return NextResponse.json(review)
}
