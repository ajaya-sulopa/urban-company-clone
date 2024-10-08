import React, { useState, useRef, useEffect } from "react";
import { useQuery, useLazyQuery } from "@apollo/client";
import {
  View,
  FlatList,
  StyleSheet,
  Image,
  Text,
  TextInput,
  ImageBackground,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView
} from "react-native";
import { Colors, Fonts, Sizes } from "../../constants/styles";
import { MaterialIcons } from "@expo/vector-icons";
import { Snackbar } from "react-native-paper";
import CollapsibleToolbar from "react-native-collapsible-toolbar";
import { GETCOLLECTIONSLIST, GET_PRODUCT_LIST } from "../../services/Product";
import { GETSEARCHLIST } from "../../services/Search";
import * as Location from "expo-location";
import LocationFetching from "../locationFetching/locationFetching";
import { GET_ACTIVE_CUSTOMER } from "../../services/Profile";

const bestSalonList = [
  {
    id: "1",
    salonImage: require("../../assets/images/salon/salon2.png"),
    salonName: "Crown salon",
    salonAddress: "A 9/a Sector 16,Gautam Budh Nagar",
    rating: 4.6,
    reviews: 100,
    isFavorite: false,
  },
  {
    id: "2",
    salonImage: require("../../assets/images/salon/salon3.png"),
    salonName: "RedBox salon",
    salonAddress: "A 9/a Sector 16,Gautam Budh Nagar",
    rating: 4.6,
    reviews: 100,
    isFavorite: false,
  },
];

const offersList = [
  {
    id: "1",
    salonName: "Joseph drake hair salon",
    salonImage: require("../../assets/images/offer/offer1.png"),
    offerTitle: "Look awesome & save some",
    offer: 25,
  },
  {
    id: "2",
    salonName: "Joseph drake hair salon",
    salonImage: require("../../assets/images/offer/offer1.png"),
    offerTitle: "Look awesome & save some",
    offer: 25,
  },
];

const HomeScreen = ({ navigation }) => {
  const { data: collectionData } = useQuery(GETCOLLECTIONSLIST);
  const [getSearchResults, { loading: searchLoading, data: searchData }] =
    useLazyQuery(GETSEARCHLIST);
  const {
    loading: customerLoading,
    error,
    data: customerData,
  } = useQuery(GET_ACTIVE_CUSTOMER);
  const { data: nearByData } = useQuery(GET_PRODUCT_LIST);
  const [mainCollectionData, setMainCollectionData] = useState([]);
  const firstName = customerData?.activeCustomer?.firstName;
  const lastName = customerData?.activeCustomer?.lastName;

  useEffect(() => {
    if (
      collectionData &&
      collectionData.collections &&
      collectionData.collections.items
    ) {
      setMainCollectionData(collectionData.collections.items);
    }
  }, [collectionData]);

  const [state, setState] = useState({
    search: null,
    bestSalons: bestSalonList,
    showSnackBar: false,
    isFavorite: null,
    address: "Loading..",
  });

  const [fetchLocation, setFetchLocation] = useState(false);

  const updateState = (data) => setState((state) => ({ ...state, ...data }));

  const { search, bestSalons, showSnackBar, isFavorite, address } = state;

  useEffect(() => {
    (async () => {
      setFetchLocation(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          updateState({ address: "Permission to access location was denied" });
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        if (location) {
          try {
            let geocode = await Location.reverseGeocodeAsync({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
            setFetchLocation(false);
            if (geocode && geocode.length > 0) {
              let address = `${geocode[0].name}, ${geocode[0].city}, ${geocode[0].region}, ${geocode[0].country}`;
              updateState({ address: address });
            } else {
              updateState({ address: "Address not found" });
            }
          } catch (error) {
            console.log("Error in reverse geocoding: ", error);
            updateState({ address: "Error fetching address" });
          }
        }
      } catch (error) {
        setFetchLocation(false);
        console.log("Error in fetching location: ", error);
        updateState({ address: "Error fetching location" });
      }
      setFetchLocation(false);
    })();
  }, []);

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  const salonImages = [
    require("../../assets/images/urbanBg.jpg"),
    require("../../assets/images/urban_bg.jpg"),
    require("../../assets/images/Electician.png"),
  ];

  const screenWidth = Dimensions.get('window').width;
  const [currentPage, setCurrentPage] = useState(0);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const contentOffsetX = event.nativeEvent.contentOffset.x;
        const newPage = Math.floor(contentOffsetX / screenWidth + 0.5);
        if (newPage !== currentPage) {
          setCurrentPage(newPage);
        }
      },
    }
  );

    const scrollViewRef = useRef(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPage((prevPage) => {
                const nextPage = prevPage + 1;
                if (nextPage >= salonImages.length) {
                    return 0;
                }
                return nextPage;
            });
        }, 3000); // 1 second interval

        return () => clearInterval(interval);
    }, [salonImages.length]);

    useEffect(() => {
        if (scrollViewRef.current) {
            scrollViewRef.current.scrollTo({
                x: currentPage * styles.carouselImage.width,
                animated: true,
            });
        }
    }, [currentPage]);

  const searchField = () => (
    <View style={styles.searchFieldWrapStyle}>
      <MaterialIcons name="search" color={Colors.whiteColor} size={15} />
      <TextInput
        value={search}
        onChangeText={(text) => {
          updateState({ search: text });
          getSearchResults({ variables: { term: text } }); // Call the search query with the current text
        }}
        placeholder="Search salon services..."
        placeholderTextColor={Colors.whiteColor}
        selectionColor={Colors.whiteColor}
        style={{
          marginLeft: Sizes.fixPadding,
          flex: 1,
          ...Fonts.whiteColor14Medium,
        }}
      />
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: Colors.whiteColor }}>
      <View style={{ flex: 1 }}>
        <CollapsibleToolbar
          renderContent={() => (
            <View style={{ flex: 1 }}>
              {popularCategoryInfo()}
              {bestSalonInfo()}
              {/* {offersInfo()} */}
            </View>
          )}
          renderNavBar={() => <></>}
          renderToolBar={() => salonImage()}
          collapsedNavBarBackgroundColor={Colors.primaryColor}
          toolBarHeight={250}
          onContentScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          automaticallyAdjustKeyboardInsets={true}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <Snackbar
        style={styles.snackBarStyle}
        visible={showSnackBar}
        onDismiss={() => updateState({ showSnackBar: false })}
      >
        {isFavorite ? "Item add to favorite" : "Item remove from favorite"}
      </Snackbar>
      {fetchLocation && <LocationFetching />}
    </View>
  );

  function salonImage() {
    return (
       <View style={styles.carouselContainer}>
            <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                ref={scrollViewRef}
                scrollEventThrottle={16} // Adjust throttle to control scroll event frequency
            >
                {salonImages.map((image, index) => (
                    <Image
                        key={index}
                        source={image}
                        style={styles.carouselImage}
                    />
                ))}
            </ScrollView>
            <View style={styles.userInfoContainer}>
                {userInfo()}
            </View>
            <View style={styles.paginationContainer}>
                {salonImages.map((_, index) => (
                    <View
                        key={index}
                        style={[
                            styles.paginationDot,
                            { backgroundColor: index === currentPage ? '#fff' : 'rgba(255, 255, 255, 0.5)' }
                        ]}
                    />
                ))}
            </View>
        </View>
    );
  }


  function offersInfo() {
    const renderItem = ({ item }) => (
      <ImageBackground
        source={item.salonImage}
        style={styles.offerImageStyle}
        borderRadius={Sizes.fixPadding}
      >
        <View>
          <Text
            numberOfLines={1}
            style={{ maxWidth: 230.0, ...Fonts.blackColor16Medium }}
          >
            {item.salonName}
          </Text>
          <Text
            numberOfLines={2}
            style={{
              lineHeight: 22.0,
              width: 200.0,
              ...Fonts.blackColor18Bold,
            }}
          >
            {item.offerTitle}
          </Text>
        </View>
        <View style={styles.offerPercentageWrapStyle}>
          <Text style={{ ...Fonts.whiteColor14Medium }}>{item.offer}% off</Text>
        </View>
      </ImageBackground>
    );
    return (
      <View style={{ marginVertical: Sizes.fixPadding + 5.0 }}>
        <Text
          style={{
            marginHorizontal: Sizes.fixPadding * 2.0,
            ...Fonts.blackColor16Bold,
          }}
        >
          Offers
        </Text>
        <FlatList
          data={offersList}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: Sizes.fixPadding * 2.0,
            paddingTop: Sizes.fixPadding + 5.0,
          }}
        />
      </View>
    );
  }

  function updateBestSalons({ id }) {
    const newList = bestSalons.map((item) => {
      if (item.id === id) {
        const updatedItem = { ...item, isFavorite: !item.isFavorite };
        updateState({ isFavorite: updatedItem.isFavorite });
        return updatedItem;
      }
      return item;
    });
    updateState({ bestSalons: newList });
  }

  function bestSalonInfo() {
    const limitedProductData = nearByData?.products?.items || [];
    const renderItem = ({ item }) => (
      <TouchableOpacity
        activeOpacity={0.6}
        onPress={() =>
          navigation.push("SalonDetail", { variantSlug: item.slug })
        }
        style={{
          alignItems: "center",
          marginRight: Sizes.fixPadding * 2.0,
        }}
      >
        <Image
          source={{
            uri: item.featuredAsset
              ? item.featuredAsset.preview
              : "https://via.placeholder.com/210x130",
          }}
          style={styles.bestSalonImageStyle}
        />
        <View style={styles.bestSalonDetailWrapStyle}>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={{ ...Fonts.whiteColor14Medium }}>
                {item.name}
              </Text>
              <Text
                numberOfLines={2}
                style={{ lineHeight: 15.0, ...Fonts.whiteColor12Light }}
              >
                'A 9/a Sector 16,Gautam Budh Nagar',
                {/* {item.salonAddress || 'No Address available'} */}
              </Text>
            </View>
            {/* <MaterialIcons
                            name={item.isFavorite ? "favorite" : "favorite-border"}
                            color={Colors.whiteColor}
                            size={15}
                            style={{ marginLeft: Sizes.fixPadding - 5.0, marginTop: Sizes.fixPadding - 5.0 }}
                            onPress={() => {
                                updateBestSalons({ id: item.id });
                                updateState({ showSnackBar: true });
                            }}
                        /> */}
          </View>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="star" color={Colors.yellowColor} size={15} />
            <Text
              style={{
                marginLeft: Sizes.fixPadding - 5.0,
                ...Fonts.whiteColor14Medium,
              }}
            >
              {/* {item.rating ? item.rating.toFixed(1) : 'N/A'} */}
              4.6
            </Text>
            <Text
              style={{
                marginLeft: Sizes.fixPadding - 5.0,
                ...Fonts.whiteColor14Medium,
              }}
            >
              {/* ({item.reviews ? item.reviews : 0} reviews)  */}
              (100 reviews)
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );

    return (
      <View style={{ marginVertical: Sizes.fixPadding + 5.0 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text
            style={{
              marginHorizontal: Sizes.fixPadding * 2.0,
              ...Fonts.blackColor16Bold,
            }}
          >
            Best services around you
          </Text>
          <TouchableOpacity
            style={{ marginHorizontal: Sizes.fixPadding * 2.0 }}
            onPress={() => navigation.push("Nearby")}
          >
            <Text style={{ ...Fonts.primaryColor14Medium }}>View All</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={limitedProductData}
          keyExtractor={(item) => `${item.id}`}
          renderItem={renderItem}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingLeft: Sizes.fixPadding * 2.0,
            paddingTop: Sizes.fixPadding + 5.0,
          }}
        />
      </View>
    );
  }

  function popularCategoryInfo() {
    const limitedProductData = mainCollectionData;
    const renderItem = ({ item }) => (
      <View
        style={{
          alignItems: "center",
          marginRight: Sizes.fixPadding * 1.3,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {!(
          item.name === "Electronics" ||
          item.name === "Computers" ||
          item.name === "Camera & Photo"
        ) && (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={() =>
                navigation.push("CategoryDetail", { productSlug: item.slug })
              }
              style={{
                backgroundColor: "#f0f0f0",
                ...styles.popularCategoryWrapStyle,
              }}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  source={{
                    uri: item.featuredAsset
                      ? item.featuredAsset.preview
                      : "https://via.placeholder.com/40",
                  }}
                  style={{ width: 50, height: 50 }}
                  resizeMode="cover"
                />
              </View>
            </TouchableOpacity>
          )}
        {!(
          item.name === "Electronics" ||
          item.name === "Computers" ||
          item.name === "Camera & Photo"
        ) && (
            <Text
              numberOfLines={1}
              style={{
                marginTop: Sizes.fixPadding - 8.0,
                ...Fonts.blackColor12Medium,
                textAlign: "center",
                flexWrap: "wrap",
                width: 100,
              }}
            >
              {item.name}
            </Text>
          )}
      </View>
    );

    return (
      <View style={{ flex: 1, width: "100%", paddingHorizontal: 5.0 }}>
        <Text
          style={{
            marginHorizontal: Sizes.fixPadding * 1.3,
            ...Fonts.blackColor16Bold,
            marginTop: Sizes.fixPadding - 5,
          }}
        >
          Popular Category
        </Text>
        <View
          style={{
            justifyContent: "center",
            alignItems: "center",
            paddingLeft: 11,
          }}
        >
          <FlatList
            data={limitedProductData}
            style={{ marginVertical: Sizes.fixPadding + 4.0 }}
            keyExtractor={(item) => `${item.id}`}
            renderItem={renderItem}
            horizontal={false}
            numColumns={3}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              flexWrap: "wrap",
              paddingHorizontal: Sizes.fixPadding,
              gap: 10,
              display: "flex",
              justifyContent: "center",
              alignSelf: "center",
              width: "100%",
            }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    );
  }

  function userInfo() {
    return (
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Image
              source={require("../../assets/images/icons/whiteNearby.png")}
              style={{ width: 16.0, height: 16.0 }}
              resizeMode="contain"
            />
            <Text
              style={{
                marginLeft: Sizes.fixPadding,
                ...Fonts.whiteColor18SemiBold,
              }}
            >
              {`${firstName} ${lastName}`}
            </Text>
          </View>
          <Text style={{ ...Fonts.whiteColor14Light }}>{address}</Text>
        </View>
        {/* <MaterialIcons
                    name="filter-alt"
                    size={22}
                    color={Colors.whiteColor}
                    onPress={() => navigation.push('Filter')}
                /> */}
      </View>
    );
  }
};

const styles = StyleSheet.create({
  searchFieldWrapStyle: {
    backgroundColor: "rgba(214, 105, 134, 0.85)",
    borderRadius: Sizes.fixPadding - 5.0,
    paddingHorizontal: Sizes.fixPadding,
    paddingVertical: Sizes.fixPadding,
    flexDirection: "row",
    alignItems: "center",
    marginTop: Sizes.fixPadding * 2.0,
    borderWidth: 1,
    borderColor: "#f0adbe",
  },
  stickySearchBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: Colors.primaryColor,
    padding: Sizes.fixPadding * 2.0,
  },
  snackBarStyle: {
    position: "absolute",
    bottom: -10.0,
    left: -10.0,
    right: -10.0,
    backgroundColor: "#333333",
    elevation: 0.0,
  },
  userInfoWrapStyle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Sizes.fixPadding + 5.0,
  },
  offerImageStyle: {
    width: "100%",
    height: "100%",
    borderColor: "rgba(197, 197, 197, 0.3)",
    borderWidth: 2.0,
    borderRadius: Sizes.fixPadding,
    justifyContent: "space-between",
    paddingLeft: Sizes.fixPadding,
    paddingTop: Sizes.fixPadding - 5.0,
    paddingBottom: Sizes.fixPadding + 5.0,
    resizeMode: "stretch",
    width: 300.0,
    height: 135.0,
    marginRight: Sizes.fixPadding * 2.0,
    overflow: "hidden",
  },
  popularCategoryWrapStyle: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Sizes.fixPadding,
    borderRadius: Sizes.fixPadding - 3.0,
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  offerPercentageWrapStyle: {
    backgroundColor: Colors.primaryColor,
    borderRadius: Sizes.fixPadding - 5.0,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    paddingHorizontal: Sizes.fixPadding,
  },
  bestSalonImageStyle: {
    borderColor: "rgba(197, 197, 197, 0.3)",
    borderWidth: 2.0,
    width: 210.0,
    height: 130.0,
    borderRadius: Sizes.fixPadding,
  },
  bestSalonDetailWrapStyle: {
    backgroundColor: "rgba(28, 41, 77, 0.85)",
    borderRadius: Sizes.fixPadding - 5.0,
    width: 185.0,
    marginTop: -40.0,
    paddingHorizontal: Sizes.fixPadding - 5.0,
    paddingBottom: Sizes.fixPadding - 5.0,
  },
  carouselContainer: {
    width: '100%',
    height: 250,
    position: 'relative',
  },
  carouselImage: {
    width: Dimensions.get('window').width,
    height: 250,
  },
  userInfoContainer: {
    position: 'absolute',
    bottom: 30,
    left: 10,
    right: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
    borderRadius: 10,
    padding: 10,
  },
  userInfoWrapStyle: {
    flexDirection: "row",
    alignItems: "center",
    // Add more styles if needed
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 5,
    alignSelf: 'center',
  },
  paginationDot: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    margin: 8,
  },
});

export default HomeScreen;
