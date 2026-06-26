import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Report } from "./captureTypes";
import { buildReportPreviewModel } from "./reportView";

export type ReportPreviewProps = {
  report: Report;
  onRetake: () => void;
  onShare?: () => void;
  isSharing?: boolean;
};

export function ReportPreview({
  report,
  onRetake,
  onShare,
  isSharing = false,
}: ReportPreviewProps) {
  const model = buildReportPreviewModel(report);

  return (
    <ScrollView
      testID="report-preview-scroll"
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      <Text
        testID="report-preview-title"
        accessibilityRole="header"
        style={styles.title}
      >
        {model.title}
      </Text>

      {model.partialNotice !== null && (
        <View testID="report-partial-notice" style={styles.partialNotice}>
          <Text accessibilityRole="text" style={styles.partialNoticeText}>
            {model.partialNotice}
          </Text>
        </View>
      )}

      <Image
        testID="report-photo"
        source={{ uri: report.photoUri }}
        accessibilityLabel="Captured field photo"
        resizeMode="cover"
        style={styles.photo}
      />

      {model.sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            {section.title}
          </Text>
          {section.rows.map((row) => (
            <View key={`${section.title}-${row.label}`} style={styles.row}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <Text style={styles.rowValue}>{row.value}</Text>
            </View>
          ))}
        </View>
      ))}

      {onShare ? (
        <Pressable
          testID="share-report"
          accessibilityRole="button"
          accessibilityLabel="Share report"
          accessibilityState={{ disabled: isSharing }}
          disabled={isSharing}
          onPress={onShare}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Share report</Text>
        </Pressable>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retake photo"
        onPress={onRetake}
        style={styles.button}
      >
        <Text style={styles.buttonText}>Retake</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    maxHeight: 360,
  },
  content: {
    alignItems: "center",
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 8,
  },
  partialNotice: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  partialNoticeText: {
    fontSize: 16,
    textAlign: "center",
  },
  photo: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  section: {
    width: "100%",
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  row: {
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 14,
    textAlign: "center",
    color: "#4B5563",
  },
  rowValue: {
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#208AEF",
    borderRadius: 8,
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
