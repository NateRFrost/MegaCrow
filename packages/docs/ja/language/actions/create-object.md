# create_object


<AvailabilityCard reach="yes" />

## 説明

指定した種類のオブジェクトを、参照オブジェクトの位置に生成します。フィルター、フラグ、オフセットは任意です。

<ActionParameters />

## 例

### バージョン &lt;73

```megalo
action create_object "area" main.team_a main
```

HREK の `broken/dmiller_sve.txt` より。

### バージョン 73+

```megalo
action create_object "warthog" at current_object set freebie
```

## 対応バージョン

<ActionSupportedVersions />


関連 [アクション構文](/ja/language/elements/trigger/action)。
