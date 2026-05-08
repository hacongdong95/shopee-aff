// app/api/shopee-images/route.ts
import { NextRequest, NextResponse } from 'next/server'

function extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
  try {
    const decoded = decodeURIComponent(url)
    const match = decoded.match(/-i\.(\d+)\.(\d+)/)
    if (match) return { shopId: match[1], itemId: match[2] }
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    const shopId = u.searchParams.get('shopid')
    const itemId = u.searchParams.get('itemid')
    if (shopId && itemId) return { shopId, itemId }
    return null
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  if (!url) return NextResponse.json({ error: 'Thiếu URL' }, { status: 400 })

  const ids = extractShopeeIds(url)
  if (!ids) return NextResponse.json({ error: 'Không parse được shopId/itemId từ URL' }, { status: 400 })

  const apiUrl = `https://shopee.vn/api/v4/item/get?itemid=${ids.itemId}&shopid=${ids.shopId}`

  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent':       'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer':          'https://shopee.vn/',
        'Accept':           'application/json',
        'Accept-Language':  'vi-VN,vi;q=0.9',
        'x-api-source':     'pc',
        'x-requested-with': 'XMLHttpRequest',
      },
    })

    if (!res.ok) return NextResponse.json({ error: `Shopee API lỗi ${res.status} — thử thêm ảnh thủ công` }, { status: 400 })

    const data = await res.json()
    const item = data?.data?.item
    if (!item) return NextResponse.json({ error: 'Shopee không trả về data' }, { status: 400 })

    const imageHashes: string[] = item.images ?? []
    const imageUrls = imageHashes.map(
      (hash: string) => `https://down-vn.img.susercontent.com/file/${hash}`
    )

    return NextResponse.json({ imageUrls, count: imageUrls.length })
  } catch (e) {
    return NextResponse.json({ error: `Lỗi kết nối: ${e}` }, { status: 500 })
  }
}
