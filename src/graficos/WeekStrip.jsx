import { fmt } from "../lib/util.js";
import { DIAS_CURTO, dayjs } from "../lib/datas.js";
import { ZONES } from "../lib/treino.js";
import { C, s } from "../estilos.js";

function WeekStrip({ dias, sel, setSel }) {
  const H = 74;
  const maxMin = Math.max(40, ...dias.map((d) => d.total));

  return (
    <div style={{ display: "flex", gap: 5, marginTop: 14 }}>
      {dias.map((d) => {
        const on = sel === d.date;
        return (
          <button
            key={d.date}
            onClick={() => setSel(on ? null : d.date)}
            style={{ ...s.diaCol, background: on ? "rgba(0,122,255,0.08)" : "transparent" }}
          >
            <span
              style={{
                ...s.diaLetra,
                color: d.hoje ? C.red : C.sec,
                fontWeight: d.hoje ? 700 : 500,
              }}
            >
              {DIAS_CURTO[d.wd]}
            </span>
            <span style={{ ...s.diaNum, ...(d.hoje ? s.diaNumHoje : {}) }}>
              {dayjs(d.date).getDate()}
            </span>
            <div
              style={{
                height: H,
                width: "100%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                marginTop: 6,
              }}
            >
              {d.total > 0 ? (
                <div style={{ ...s.diaBarra, height: `${(d.total / maxMin) * H}px` }}>
                  {[...ZONES]
                    .reverse()
                    .map((z) =>
                      d.zones[z.id] > 0 ? (
                        <div
                          key={z.id}
                          style={{
                            height: `${(d.zones[z.id] / d.total) * 100}%`,
                            background: z.color,
                            width: "100%",
                          }}
                        />
                      ) : null,
                    )}
                </div>
              ) : (
                <div style={s.diaVazio} />
              )}
            </div>
            <span style={{ ...s.diaMin, color: d.total ? C.label : C.ter }}>
              {d.total ? fmt(d.total) : "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { WeekStrip };
