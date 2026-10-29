// Prints "<id> <x> <y> <w> <h> <title>" for each on-screen window of the named app (default Claude), largest first.
import CoreGraphics
import Foundation

let owner = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "Claude"
let list = CGWindowListCopyWindowInfo([.optionAll, .excludeDesktopElements], kCGNullWindowID) as? [[String: Any]] ?? []
let rows = list.compactMap { w -> (Int, CGRect, String)? in
    guard w[kCGWindowOwnerName as String] as? String == owner,
          w[kCGWindowLayer as String] as? Int == 0,
          let id = w[kCGWindowNumber as String] as? Int,
          let b = w[kCGWindowBounds as String] as? [String: CGFloat],
          let rect = CGRect(dictionaryRepresentation: b as CFDictionary),
          rect.width > 200, rect.height > 200 else { return nil }
    return (id, rect, w[kCGWindowName as String] as? String ?? "")
}
for (id, r, title) in rows.sorted(by: { $0.1.width * $0.1.height > $1.1.width * $1.1.height }) {
    print(id, Int(r.minX), Int(r.minY), Int(r.width), Int(r.height), title)
}
