<?php

namespace App\Services\Integrations;

/**
 * Normalise le patch formulaire étape 1 renvoyé par le LLM (équivalent frontend step1-form-patch.ts).
 *
 * @param  list<string>  $allowedOptions
 * @param  list<string>  $allowedDietary
 * @return array<string, mixed>|null
 */
class Step1FormPatchNormalizer
{
    public static function normalize(mixed $raw, array $allowedOptions, array $allowedDietary): ?array
    {
        if (! is_array($raw)) {
            return null;
        }
        $optSet = array_flip($allowedOptions);
        $dietSet = array_flip($allowedDietary);
        $patch = [];

        $dep = self::normIata($raw['departureCity'] ?? null);
        if ($dep !== null) {
            $patch['departureCity'] = $dep;
        }
        $arr = self::normIata($raw['arrivalCity'] ?? null);
        if ($arr !== null) {
            $patch['arrivalCity'] = $arr;
        }
        $name = self::normString($raw['arrivalCityName'] ?? null);
        if ($name !== null) {
            $patch['arrivalCityName'] = $name;
        }
        $tc = self::normInt1to50($raw['travelerCount'] ?? null);
        if ($tc !== null) {
            $patch['travelerCount'] = $tc;
        }
        $bud = self::normString($raw['budget'] ?? null);
        if ($bud !== null) {
            $patch['budget'] = $bud;
        }
        $act = self::normString($raw['activityTime'] ?? null);
        if ($act !== null) {
            $patch['activityTime'] = $act;
        }
        $od = self::normDate($raw['outboundDate'] ?? null);
        if ($od !== null) {
            $patch['outboundDate'] = $od;
        }
        $rd = self::normDate($raw['returnDate'] ?? null);
        if ($rd !== null) {
            $patch['returnDate'] = $rd;
        }
        foreach (
            [
                'outboundDepartureTime',
                'outboundArrivalTime',
                'returnDepartureTime',
                'returnArrivalTime',
            ] as $k
        ) {
            $t = self::normTime($raw[$k] ?? null);
            if ($t !== null) {
                $patch[$k] = $t;
            }
        }
        $td = self::normTravelDays($raw['travelDays'] ?? null);
        if ($td !== null) {
            $patch['travelDays'] = $td;
        }
        $so = self::normStringArray($raw['selectedOptions'] ?? null, $optSet);
        if (is_array($so) && $so !== []) {
            $patch['selectedOptions'] = $so;
        }
        $ds = self::normStringArray($raw['dietarySelections'] ?? null, $dietSet);
        if (is_array($ds) && $ds !== []) {
            $patch['dietarySelections'] = $ds;
        }

        return $patch === [] ? null : $patch;
    }

    private static function normIata(mixed $v): ?string
    {
        if (! is_string($v)) {
            return null;
        }
        $s = strtoupper(trim($v));
        if (strlen($s) === 3 && preg_match('/^[A-Z]{3}$/', $s)) {
            return $s;
        }

        return null;
    }

    private static function normDate(mixed $v): ?string
    {
        if (! is_string($v)) {
            return null;
        }
        $s = trim($v);
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)) {
            return $s;
        }

        return null;
    }

    private static function normTime(mixed $v): ?string
    {
        if (! is_string($v)) {
            return null;
        }
        $s = substr(trim($v), 0, 5);
        if (preg_match('/^([01]?\d|2[0-3]):[0-5]\d$/', $s)) {
            [$h, $m] = explode(':', $s);

            return str_pad($h, 2, '0', STR_PAD_LEFT).':'.$m;
        }

        return null;
    }

    private static function normString(mixed $v): ?string
    {
        if (! is_string($v)) {
            return null;
        }
        $s = trim($v);

        return $s === '' ? null : $s;
    }

    private static function normInt1to50(mixed $v): ?int
    {
        $n = is_int($v) ? $v : (int) (is_string($v) || is_float($v) ? $v : 0);
        if (! is_finite($n) || $n < 1 || $n > 50) {
            return null;
        }

        return $n;
    }

    private static function normTravelDays(mixed $v): ?int
    {
        $n = is_int($v) ? $v : (int) (is_string($v) || is_float($v) ? $v : 0);
        if (! is_finite($n) || $n < 1 || $n > 365) {
            return null;
        }

        return $n;
    }

    /**
     * @param  array<string, int>  $allowed
     * @return list<string>|null
     */
    private static function normStringArray(mixed $v, array $allowed): ?array
    {
        if (! is_array($v)) {
            return null;
        }
        $out = [];
        foreach ($v as $x) {
            if (is_string($x) && isset($allowed[trim($x)])) {
                $out[] = trim($x);
            }
        }

        return $out === [] ? [] : array_values(array_unique($out));
    }
}
