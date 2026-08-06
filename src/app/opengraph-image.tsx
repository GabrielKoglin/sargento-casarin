import { ImageResponse } from 'next/og'

// Metadados da imagem (convenção App Router / Next 16)
export const alt =
  'Sargento Dickson Casarin — Candidato a Deputado Estadual · Mato Grosso 2026'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

// Paleta oficial (globals.css :root)
const NAVY = '#0d3b66'
const ABYSS = '#04111f'
const ABYSS_DEEP = '#020b14'
const GREEN = '#00b84b'
const NIGHT_VISION = '#A6F75B'
const CREME = '#F2EDE5'
const WHITE = '#FFFFFF'

// Geração da imagem — fonte PADRÃO do next/og (sem rede, robusto).
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: `linear-gradient(135deg, ${NAVY} 0%, ${ABYSS} 58%, ${ABYSS_DEEP} 100%)`,
        }}
      >
        {/* Brilho HUD discreto no canto superior */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            background:
              'radial-gradient(circle at 82% 12%, rgba(0,184,75,0.16), transparent 46%)',
          }}
        />

        {/* Faixa tática verde — topo */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            display: 'flex',
            background: GREEN,
          }}
        />

        {/* Faixa tática verde — base */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 10,
            display: 'flex',
            background: GREEN,
          }}
        />

        {/* Conteúdo */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            padding: '86px 84px',
            justifyContent: 'space-between',
          }}
        >
          {/* Rótulo tático */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                border: `2px solid ${GREEN}`,
                borderRadius: 8,
                padding: '10px 22px',
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: NIGHT_VISION,
                  marginRight: 14,
                  display: 'flex',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  color: NIGHT_VISION,
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: 4,
                }}
              >
                OP. 2026 — ATIVO
              </div>
            </div>
          </div>

          {/* Bloco principal */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                color: WHITE,
                fontSize: 104,
                fontWeight: 800,
                lineHeight: 1.0,
                letterSpacing: -2,
              }}
            >
              <div style={{ display: 'flex' }}>SARGENTO DICKSON</div>
              <div style={{ display: 'flex' }}>CASARIN</div>
            </div>

            {/* Barra de acento verde */}
            <div
              style={{
                display: 'flex',
                width: 240,
                height: 9,
                background: GREEN,
                marginTop: 30,
                marginBottom: 30,
              }}
            />

            {/* Subtítulo */}
            <div
              style={{
                display: 'flex',
                color: CREME,
                fontSize: 34,
                fontWeight: 600,
                letterSpacing: 2,
              }}
            >
              CANDIDATO A DEPUTADO ESTADUAL · MATO GROSSO 2026
            </div>
          </div>

          {/* Rodapé tático */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                width: 12,
                height: 12,
                background: NIGHT_VISION,
                marginRight: 16,
                display: 'flex',
              }}
            />
            <div
              style={{
                display: 'flex',
                color: NIGHT_VISION,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 6,
              }}
            >
              MT · BRASIL
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
