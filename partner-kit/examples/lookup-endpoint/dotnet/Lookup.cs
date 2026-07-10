// Tiket Connect Agent — internal lookup endpoint (.NET minimal API example).
//
// The only code you write: barcode in → ticket JSON out (404 if unknown).
// Bind to localhost / your private network only — the agent is the sole caller.
//
//   dotnet run    →  http://127.0.0.1:8080/tiket/lookup?barcode=…

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://127.0.0.1:8080");
var app = builder.Build();

app.MapGet("/tiket/lookup", (string barcode) =>
{
    // Replace with your real query, e.g. (EF Core / Dapper):
    //   var t = db.Tickets.SingleOrDefault(t => t.Barcode == barcode);
    //   if (t is null) return Results.NotFound();
    //   return Results.Json(new {
    //       barcode = t.Barcode, event_name = t.EventName, venue = t.VenueName,
    //       date = t.EventDate.ToString("yyyy-MM-dd"), time = t.EventTime,
    //       section = t.Section, row = t.RowNum, seat = t.SeatNum,
    //       status = t.Status, original_price = t.FaceValue,
    //       ticket_ref = t.Id.ToString(), barcode_format = "qr" });
    if (barcode == "1000000000001")
    {
        return Results.Json(new
        {
            barcode,
            event_name = "עומר אדם — סיבוב קיץ",
            venue = "היכל מנורה מבטחים",
            date = "2030-08-15",
            time = "21:00",
            section = "A", row = "12", seat = "7",
            status = "active",
            original_price = 350,
            ticket_ref = "DEMO-1",
            barcode_format = "qr",
        });
    }
    return Results.NotFound();
});

app.Run();
