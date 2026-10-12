import type { RenderElement } from 'claude-code'

import { fileBadge, headline, sizeBar } from './kit/svg'
import type { HeaderOpts } from './kit/svg'
import { ButtonRow, Card, HeaderBlock, Highlight, Meter, StatRow } from './kit/ui'
import { isText, noop, Pic, Section } from './ctx'
import type { Ctx } from './ctx'

const FILES = [
  { name: 'vendor.81d3aa.js', size: 79 },
  { name: 'app.4f9c2e.js', size: 63 },
  { name: 'vendor.81d3aa.js.map', size: 35 },
  { name: 'inter-var.woff2', size: 47 },
]
const TOTAL_KB = 286
const SIZE_COLUMN = 7

function readCard(ctx: Ctx): RenderElement {
  const { width } = ctx
  const header: HeaderOpts = {
    icon: 'eye', role: 'read', eyebrow: 'Şu an', meta: '2 dk önce', width,
    headline: 'Claude client.test.js dosyasını okuyor', sub: 'tests klasöründe · bu turda 3 dosya açıldı',
  }
  const buttons = [
    { label: 'Dosyayı aç', variant: 'primary' as const, hotkey: 'o', onPress: noop },
    { label: 'Geçmiş', onPress: noop },
    { label: 'Şimdi değil', variant: 'plain' as const, onPress: noop },
  ]

  return Card(ctx, {
    header,
    children: [
      Meter(ctx, { label: 'Bağlam', value: 0.42, pace: 0.35, width }),
      ButtonRow(ctx, { buttons }),
    ],
  })
}

function fileRow(ctx: Ctx, file: { name: string; size: number }): RenderElement {
  const { Box, Text } = ctx.ui
  const size = `${file.size} KB`.padStart(SIZE_COLUMN)

  return (
    <Box key={file.name} flexDirection="row" gap={1} alignItems="center">
      {isText(ctx) ? null : Pic(ctx, fileBadge({ name: file.name }))}
      <Box flexGrow={1}><Text>{file.name}</Text></Box>
      <Text dimColor>{size}</Text>
      {isText(ctx) ? null : Pic(ctx, sizeBar({ size: file.size, total: TOTAL_KB }))}
    </Box>
  )
}

function dangerCard(ctx: Ctx): RenderElement {
  const { width } = ctx
  const header: HeaderOpts = {
    icon: 'trash', eyebrow: 'Geri alınamaz', meta: 'demo-app', width,
    headline: 'rm -rf build 9 dosyayı silecek · 286 KB', mark: '9 dosyayı silecek · 286 KB',
    sub: "Hiçbiri git'te izlenmiyor; silinince geri getirilemez.",
  }
  const buttons = [
    { label: '9 dosyayı sil', variant: 'primary' as const, isDestructive: true, onPress: noop },
    { label: 'İptal', isSafe: true, onPress: noop },
    { label: '3 dosya daha', variant: 'plain' as const, hotkey: 'm', onPress: noop },
  ]

  return Card(ctx, {
    header,
    isDanger: true,
    children: [...FILES.map(file => fileRow(ctx, file)), ButtonRow(ctx, { buttons, isDanger: true })],
  })
}

function warnCard(ctx: Ctx): RenderElement {
  const { width } = ctx
  const stats = [
    { label: 'Şimdi gönder', value: '$0,52', role: 'warn' as const },
    { label: 'Sıcakken', value: '$0,03', role: 'ok' as const },
    { label: 'Yeniden yazılır', value: '51,9k', unit: 'token', spark: [12, 18, 15, 26, 31, 29, 44, 52] },
  ]

  return Card(ctx, {
    role: 'warn',
    header: { icon: 'clock', eyebrow: 'Önbellek soğudu', meta: '6 sa 38 dk önce', headline: 'Mesajın bekletiliyor', sub: 'Şimdi göndermek tüm bağlamı yeniden yazar.', width },
    children: [
      StatRow(ctx, { stats, width }),
      ButtonRow(ctx, { buttons: [{ label: 'Öde ve gönder', variant: 'primary', onPress: noop }, { label: 'Yeni başla', onPress: noop }, { label: 'Önbellek durumu', variant: 'plain', onPress: noop }] }),
    ],
  })
}

function statesCards(ctx: Ctx): RenderElement[] {
  const { ui, width } = ctx
  const { Text } = ui

  return [
    Card(ctx, {
      role: 'ok',
      header: { icon: 'bookmark', eyebrow: 'Kural kaydedildi', meta: '%95 emin', headline: 'Bu projeye kaydedildi', width },
      children: [
        <Text>
          <Text>{'Claude bir sonraki mesajdan itibaren '}</Text>
          {Highlight(ctx, { text: 'pnpm', role: 'ok' })}
          <Text>{' kullanacak.'}</Text>
        </Text>,
      ],
    }),
    Card(ctx, {
      header: { eyebrow: 'Plan yok', width },
      children: [<Text>Bu oturumda henüz bir plan yok.</Text>, ButtonRow(ctx, { buttons: [{ label: 'Plan başlat', onPress: noop }] })],
    }),
    Card(ctx, {
      isDanger: true,
      header: { icon: 'x', eyebrow: 'Hata', headline: 'Testler çalıştırılamadı', width },
      children: [<Text dimColor>npm test 127 ile çıktı: komut bulunamadı.</Text>, ButtonRow(ctx, { buttons: [{ label: 'Tekrar dene', variant: 'primary', hotkey: 't', onPress: noop }] })],
    }),
  ]
}

export const cardsSection = (ctx: Ctx): RenderElement =>
  Section(ctx, { title: 'Kartlar', meta: 'okuma · tehlike · uyarı · durumlar', children: [readCard(ctx), dangerCard(ctx), warnCard(ctx), ...statesCards(ctx)] })

const HEADERS: Omit<HeaderOpts, 'width'>[] = [
  { icon: 'terminal', role: 'run', eyebrow: 'Ajan çalışıyor', meta: '0:43', headline: 'Açılış sayfası hazırlanıyor', sub: '4/5 · Kayıt formu' },
  { icon: 'pencil', role: 'edit', eyebrow: 'Bitti', headline: 'Claude 1 dosyayı düzenledi', mark: '1 dosyayı', sub: 'src/api/client.js +1 −1' },
  { icon: 'list', role: 'plan', eyebrow: 'Düzenleme 2 / 4', headline: 'greet.js', sub: 'src/greet.js · Edit' },
  { icon: 'bulb', role: 'warn', eyebrow: 'Bilmen gereken', headline: 'Her Kling klibi yaklaşık $0,45 tutuyor; uzun bir başlık iki satırı aşarsa üç nokta ile kesilir ve kart düzeni bozulmaz', mark: 'yaklaşık $0,45' },
  { icon: 'shield', role: 'danger', eyebrow: 'Sır bulundu', meta: '.env:3', headline: 'sk-…9f2A anahtarı commit edilmek üzere' },
  { icon: 'gauge', eyebrow: 'Düşünüyor', headline: 'Henüz dosyaya dokunulmadı' },
]

export function headersSection(ctx: Ctx): RenderElement {
  const { width } = ctx
  const blocks = HEADERS.map(header => Card(ctx, { role: header.role, header: { ...header, width } }))

  return Section(ctx, { title: 'Başlık blokları', meta: '7 rol + nötr', children: blocks })
}

export function typeSection(ctx: Ctx): RenderElement {
  const { width } = ctx
  const children = [
    HeaderBlock(ctx, { eyebrow: 'Tüm dosyalar', meta: 'WEATHER-APP', width }),
    Pic(ctx, headline({ text: 'Tek satırlık başlık', width })),
    Pic(ctx, headline({ text: 'Vurgulu başlık: her klip yaklaşık $0,45 tutuyor', width, mark: 'yaklaşık $0,45', markRole: 'edit' })),
    Pic(ctx, headline({ text: 'Başlık 14/600 boyutunda da kullanılabilir', width, size: 14, weight: 600 })),
  ]

  return Section(ctx, { title: 'Tipografi', meta: 'eyebrow · headline', children: Card(ctx, { children }) })
}
