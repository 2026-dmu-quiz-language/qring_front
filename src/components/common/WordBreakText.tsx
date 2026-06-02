import React from "react";
import { StyleSheet, Text, TextStyle, View } from "react-native";

const WordBreakText = ({
  text,
  textStyles,
}: {
  text: string;
  textStyles?: TextStyle;
}) => {
  return (
    <View style={styles.container}>
      {text.split(" ").map((word, index) => (
        <Text key={`${word}-${index}`} style={textStyles}>
          {word}{" "}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
});

export default WordBreakText;
