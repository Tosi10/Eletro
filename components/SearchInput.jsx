import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";

import { icons } from "../constants";

const SearchInput = ({
  title,
  value,
  placeholder,
  handleChangeText,
  otherStyles,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    

      <View className="w-full h-16 px-4 border-black-200 bg-black-100 rounded-2xl flex-row focus:border-secondary items-center border-2 space-x-4">
        <TextInput
          className="text-base mt--0.5 text-white flex-1 font-pregular "
          value={value}
          placeholder="Search for a video topic"
          placeholderTextColor="#7B7B8B"
          onChangeText={handleChangeText}
          secureTextEntry={title === "Password" && !showPassword}
          {...props}
        />

        <TouchableOpacity>
            <Image
                source={icons.search}
                className="w-6 h-6"
                resizeMode="contain"
            />
        </TouchableOpacity>
      </View>
   
  );
};

export default SearchInput;